/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { ICartState } from '@msdyn365-commerce/global-state';
import { ArrayExtensions } from '@msdyn365-commerce-modules/retail-actions';
import {
    CartLine,
    ChannelDeliveryOptionConfiguration,
    DeliveryOption,
    OrgUnitLocation,
    ProductDeliveryOptions,
    SimpleProduct
} from '@msdyn365-commerce/retail-proxy';
import { IStoreSelectorStateManager } from '@msdyn365-commerce-modules/bopis-utilities';
import { INodeProps } from '@msdyn365-commerce-modules/utilities';
import * as React from 'react';

export interface IPickUpInStoreViewProps {
    callbacks: {
        toggleBopis(isBopisSelected: boolean): void;
    };
    defaultComponent?: React.ReactNode;
    orgUnitName?: string;
    isBopisSelected: boolean;
    ContainerProps: INodeProps;
    deliveryOption?: string;
}

export interface IPickUpInStoreProps {
    cartline: CartLine;
    product: SimpleProduct;
    shipitText: string;
    pickUpInStoreText: string;
    changeStoreText: string;
    cartState: ICartState | undefined;
    storeSelectorStateManager: IStoreSelectorStateManager | undefined;
    orgUnitLocations?: OrgUnitLocation[] | undefined;
    deliveryOptions?: ProductDeliveryOptions;
    pickupDeliveryModeCode?: string;
    storeSelectorModuleId?: string;
    channelDeliveryOptionConfig?: ChannelDeliveryOptionConfiguration;
    retailMulitplePickupFeatureState?: boolean;
    locationChangedHandler(): void;
}

export const PickUpInStore = (props: IPickUpInStoreProps): IPickUpInStoreViewProps | undefined => {
    const _onLocationChangedCallback = async (
        orgUnitLocation: OrgUnitLocation,
        cartState: ICartState | undefined,
        cartline: CartLine,
        deliveryMode?: string
    ) => {
        if (!cartState) {
            return Promise.resolve();
        }
        return cartState
            .updateCartLinePickupLocation({ cartLineId: cartline.LineId!, location: orgUnitLocation, deliveryMode })
            .then(result => {
                if (result.status === 'SUCCESS') {
                    props.locationChangedHandler();
                }
            })
            .catch(error => {});
    };

    const _toggleBOPIS = (isBopisSelected: boolean) => {
        const { storeSelectorStateManager, product, cartline, cartState, storeSelectorModuleId } = props;

        if (isBopisSelected) {
            if (!storeSelectorStateManager) {
                return;
            }
            storeSelectorStateManager
                .openDialog({
                    id: storeSelectorModuleId,
                    product,
                    alreadySelectedLocation: {
                        OrgUnitNumber: cartline.FulfillmentStoreId
                    },
                    deliveryOptions: props.deliveryOptions,
                    onLocationSelected: async (orgUnitLocation, deliveryMode: string | undefined) => {
                        return _onLocationChangedCallback(orgUnitLocation, cartState, cartline, deliveryMode);
                    }
                })
                .catch(error => {});
        } else {
            if (!cartState) {
                return;
            }
            cartline.DeliveryMode = '';
            cartline.FulfillmentStoreId = '';
            cartline.ShippingAddress = {};
            cartState
                .clearCartLinePickupLocation({ cartLineId: cartline.LineId! })
                .then(result => {
                    if (result.status === 'SUCCESS') {
                        props.locationChangedHandler();
                    }
                })
                .catch(error => {});
        }
    };

    const _getOrgUnitName = (fulfillmentStoreId: string | undefined, orgUnitLocations: OrgUnitLocation[] | undefined) => {
        if (!orgUnitLocations || !fulfillmentStoreId || orgUnitLocations.length === 0) {
            return '';
        }

        const foundLocation = orgUnitLocations.find(orgUnitLocation => {
            return orgUnitLocation.OrgUnitNumber === fulfillmentStoreId;
        });

        if (foundLocation) {
            return foundLocation.OrgUnitName;
        }
        return fulfillmentStoreId;
    };

    const _renderShippingMethod = (
        cartLine: CartLine,
        shipItText: string,
        pickupInStoretext: string,
        changeStoreText: string,
        orgUnitLocations: OrgUnitLocation[] | undefined
    ): JSX.Element => {
        const orgUnitName = _getOrgUnitName(cartLine.FulfillmentStoreId, orgUnitLocations);
        const bopisSelected = !!cartLine.FulfillmentStoreId;

        const toggleBOPIS = (isBopisSelected: boolean) => {
            return () => {
                _toggleBOPIS(isBopisSelected);
            };
        };

        return (
            <>
                <label className='msc-cart-line__bopis-shipping'>
                    <input
                        id={`ms-cart-bopis-ship-option-${cartLine.LineId}`}
                        type='radio'
                        name={`shippingType ${cartLine.LineId}`}
                        onChange={toggleBOPIS(false)}
                        value={shipItText}
                        checked={!bopisSelected}
                        aria-checked={!bopisSelected}
                        key={`${cartLine.LineId}-shipit`}
                    />
                    {shipItText}
                </label>
                <label className='msc-cart-line__bopis-store-pickup'>
                    <input
                        id={`ms-cart-bopis-pickup-option-${cartLine.LineId}`}
                        type='radio'
                        name={`shippingType ${cartLine.LineId}`}
                        onChange={toggleBOPIS(true)}
                        value={pickupInStoretext}
                        checked={bopisSelected}
                        aria-checked={bopisSelected}
                        key={`${cartLine.LineId}-pickup`}
                    />
                    {pickupInStoretext}
                </label>
                {cartLine.FulfillmentStoreId ? (
                    <div className='msc-cart-line__bopis__fullfilment'>
                        <span className='msc-cart-line__bopis__fullfilment-store'>{orgUnitName}</span>
                        <button className='msc-cart-line__bopis-changestore btn' onClick={toggleBOPIS(true)}>
                            {changeStoreText}
                        </button>
                    </div>
                ) : null}
            </>
        );
    };

    const _getDeliveryOption = (pickupStore: IPickUpInStoreProps, deliveryOptions: ProductDeliveryOptions) => {
        const delivery = deliveryOptions?.DeliveryOptions?.find(option => option.Code === pickupStore.pickupDeliveryModeCode);
        return delivery?.Description;
    };

    /**
     * Method to check if we have atleast one common delivery code between product and channel.
     * @param productdeliveryOptions - Product DeliveryOption List.
     * @param storePickUpOptionList - Channel DeliveryOption List.
     * @returns Boolean flag.
     */
    const matchDeliveryOptions = (
        productdeliveryOptions: DeliveryOption[] | undefined,
        storePickUpOptionList: string[] | undefined
    ): boolean => {
        const deliveryOption: string[] = [];
        productdeliveryOptions?.map(delivery => {
            const pickup = storePickUpOptionList?.find(deliveryCode => deliveryCode === delivery.Code);
            if (pickup) {
                deliveryOption.push(pickup);
            }
            return deliveryOption;
        });

        return ArrayExtensions.hasElements(deliveryOption);
    };

    // If no delivery options present on the product, or none of the delivery options
    // match the PickupDeliveryModeCode, that means the item cannot be used for BOPIS
    if (!props.deliveryOptions || !props.deliveryOptions.DeliveryOptions) {
        return undefined;
    }

    if (props.retailMulitplePickupFeatureState && props.channelDeliveryOptionConfig) {
        if (!matchDeliveryOptions(props.deliveryOptions.DeliveryOptions, props.channelDeliveryOptionConfig?.PickupDeliveryModeCodes)) {
            return undefined;
        }
    } else if (
        !props.pickupDeliveryModeCode ||
        !props.deliveryOptions.DeliveryOptions.find(option => option.Code === props.pickupDeliveryModeCode)
    ) {
        return undefined;
    }

    return {
        callbacks: {
            toggleBopis: _toggleBOPIS
        },
        defaultComponent: _renderShippingMethod(
            props.cartline,
            props.shipitText,
            props.pickUpInStoreText,
            props.changeStoreText,
            props.orgUnitLocations
        ),
        orgUnitName: _getOrgUnitName(props.cartline.FulfillmentStoreId, props.orgUnitLocations),
        isBopisSelected: !!props.cartline.FulfillmentStoreId,
        deliveryOption: _getDeliveryOption(props, props.deliveryOptions),
        ContainerProps: {
            className: 'msc-cart-line__bopis-container'
        }
    };
};
