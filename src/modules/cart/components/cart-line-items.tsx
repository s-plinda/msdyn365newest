/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import {
    AddToOrderTemplateComponent,
    AddToWishlistComponent,
    CartLineItemComponent,
    IAddToOrderTemplateDialogResources,
    ICartlineResourceString,
    IDuplicateItemsWhenAddingToOrderTemplateDialogResources,
    IItemAddedToOrderTemplateDialogResources,
    IOrderTemplateNameDialogResources,
    IWishlistActionSuccessResult
} from '@msdyn365-commerce/components';
import MsDyn365, {
    IAny,
    ICoreContext,
    IGeneric,
    IGridSettings,
    IImageSettings,
    ITelemetry,
    TelemetryEvent,
    isChannelTypeB2B
} from '@msdyn365-commerce/core';
import { ICartState } from '@msdyn365-commerce/global-state';
import {
    AsyncResult,
    CartLine,
    CartLineValidationResultsByLineId,
    ChannelDeliveryOptionConfiguration,
    CommerceList,
    Customer,
    OrgUnitLocation,
    ProductDeliveryOptions,
    SimpleProduct
} from '@msdyn365-commerce/retail-proxy';
import { ProductCatalog, ProductDimensionType, ReleasedProductType } from '@msdyn365-commerce/retail-proxy/dist/Entities/CommerceTypes.g';
import { IStoreSelectorStateManager } from '@msdyn365-commerce-modules/bopis-utilities';
import {
    ArrayExtensions,
    getInvoiceDetailsPageUrlSync,
    getProductUrlSync,
    IProductInventoryInformation,
    isCartLineItemPickUpType,
    ObjectExtensions,
    OrderTemplate,
    StringExtensions
} from '@msdyn365-commerce-modules/retail-actions';
import { Button, getPayloadObject, getTelemetryAttributes, ITelemetryContent } from '@msdyn365-commerce-modules/utilities';
import classnames from 'classnames';
import * as React from 'react';

import { getProductByProductId, getProductByProductIdAndWarehouse } from '@msdyn365-commerce-modules/cart';
import { IPickUpInStoreViewProps, PickUpInStore } from './cart-pick-up-in-store';

export interface ICartLineItemsProps {
    cartlines: CartLine[];
    cartlinesErrors: CartLineValidationResultsByLineId;
    cartState: ICartState | undefined;
    orgUnitLocations: OrgUnitLocation[] | undefined;
    resources: ICartlineResourceString;
    productAvailabilites: IProductInventoryInformation[] | undefined;
    products: SimpleProduct[] | undefined;
    productDeliveryOptions: ProductDeliveryOptions[] | undefined;
    pickupDeliveryModeCode?: string;
    catalogs?: ProductCatalog[];
    retailMulitplePickupFeatureState?: boolean;

    /* GridSettings for the product image in cartline */
    gridSettings: IGridSettings;

    /* ImageSettings for the product image in cartline */
    imageSettings: IImageSettings;
    id: string;
    typeName: string;
    context: ICoreContext<IGeneric<IAny>>;
    telemetry: ITelemetry;
    removeButtonText: string;
    addToWishlistButtonText: string;
    removeFromWishlistButtonText: string;
    shipItText: string;
    pickitUpText: string;
    changeStoreText: string;
    outOfStockText: string;
    outOfRangeOneText: string;
    outOfRangeFormatText: string;
    storeSelectorStateManager: IStoreSelectorStateManager | undefined;
    isStockCheckEnabled: boolean;
    wishlists: CommerceList[] | undefined;
    defaultWishlistName: string;
    maxCartlineQuantity: number;
    includeErrors?: boolean;
    showShippingChargesForLineItems?: boolean;
    telemetryContent?: ITelemetryContent;
    isQuantityLimitsFeatureEnabled: boolean;
    hasInvoiceLine?: boolean;
    storeSelectorModuleId?: string;
    channelDeliveryOptionConfig?: ChannelDeliveryOptionConfiguration;

    addToOrderTemplateDialogResources: IAddToOrderTemplateDialogResources;
    createOrderTemplateDialogResources: IOrderTemplateNameDialogResources;
    itemAddedToOrderTemplateDialogResources: IItemAddedToOrderTemplateDialogResources;
    duplicateItemsWhenAddingToOrderTemplateDialogResources: IDuplicateItemsWhenAddingToOrderTemplateDialogResources;

    addToOrderTemplateButtonText: string;
    addToOrderTemplateButtonTooltip: string;
    addToOrderTemplateMessage: string;
    addItemToOrderTemplateError: string;
    orderTemplates: OrderTemplate[] | undefined;
    customerInformation: Customer | undefined;
    shouldIgnoreWarehouse: boolean | undefined;
    productAvailability?: AsyncResult<IProductInventoryInformation[]>;
    productPickUpOptions?: ProductDeliveryOptions[] | undefined;
    isMultipleCatalogFeatureEnabledInHq: boolean;
    catalogId?: number;

    removeItemClickHandler(cartlineToRemove: CartLine): void;
    moveToWishlistSuccessHandler(result: IWishlistActionSuccessResult, cartlineId: CartLine): void;
    updateCartLinesQuantitySuccessHandler(cartline: CartLine, quantity: number, lineIndex?: number): boolean;
    locationChangedHandler(): void;
}

export interface ICartlinesViewProps {
    cartline: React.ReactNode;
    pickUpInStore?: IPickUpInStoreViewProps;
    remove: React.ReactNode;
    addToWishlist: React.ReactNode | undefined;
    addToOrderTemplate: React.ReactNode | undefined;

    error?: string;
    cartlineId?: string;
    hasError?: boolean;
    data?: {
        product?: SimpleProduct;
        cartline: CartLine;
    };
}

const _getCartItemAvailableQuantity = (
    isStockCheckEnabled: boolean,
    productAvailability: IProductInventoryInformation | undefined
): number => {
    if (
        !isStockCheckEnabled ||
        !productAvailability ||
        !productAvailability.ProductAvailableQuantity ||
        !productAvailability.IsProductAvailable ||
        !productAvailability.ProductAvailableQuantity.AvailableQuantity
    ) {
        return 0;
    }

    return productAvailability.ProductAvailableQuantity.AvailableQuantity;
};

const _getCartItemMaxQuantity = (
    maxQuantityByConfig: number,
    isStockCheckEnabled: boolean,
    availableQuantityInStock: number,
    isQuantityLimitsFeatureEnabled: boolean,
    maxByQuantityLimitsFeature: number
) => {
    if (isQuantityLimitsFeatureEnabled) {
        let maxByQuantityLimitsFeatureResult = maxByQuantityLimitsFeature;

        // If max by feature in not defined when feature is on then we suggest that there no max by feature
        // and consider available qty if stock check enabled and max from config in site settings.
        if (!maxByQuantityLimitsFeature) {
            maxByQuantityLimitsFeatureResult = maxQuantityByConfig || 10;
        }

        return isStockCheckEnabled
            ? maxByQuantityLimitsFeatureResult < availableQuantityInStock
                ? maxByQuantityLimitsFeatureResult
                : availableQuantityInStock
            : maxByQuantityLimitsFeatureResult;
    }
    if (isStockCheckEnabled) {
        return availableQuantityInStock < maxQuantityByConfig ? availableQuantityInStock : maxQuantityByConfig;
    }
    return maxQuantityByConfig;
};

const _getErrorMessage = (
    availableQuantityInStock: number,
    currentQuantity: number,
    props: ICartLineItemsProps,
    shouldSkipStockCheck: boolean,
    cartLine: CartLine,
    lineId: string | undefined,
    foundProductAvailability?: IProductInventoryInformation
): string | undefined => {
    const finalErrorMessages: string[] = [];

    const isLoadingDeliveryOptions = props.productAvailability?.status === 'LOADING';
    if (isLoadingDeliveryOptions) {
        return undefined;
    }
    // check availability passed as prop for each cartline
    if (props.productAvailabilites && ArrayExtensions.hasElements(props.productAvailabilites)) {
        if (foundProductAvailability === undefined) {
            finalErrorMessages.push(props.outOfStockText);
            return finalErrorMessages.toString();
        }
    }
    if (props.includeErrors && props.isStockCheckEnabled && !shouldSkipStockCheck) {
        if (availableQuantityInStock <= 0) {
            finalErrorMessages.push(props.outOfStockText);
        } else if (availableQuantityInStock < currentQuantity) {
            if (availableQuantityInStock === 1) {
                finalErrorMessages.push(props.outOfRangeOneText);
            } else {
                finalErrorMessages.push(props.outOfRangeFormatText.replace('{numLeft}', availableQuantityInStock.toString()));
            }
        }
    }

    // Server-side validation
    const checkForErrors = props.cartlinesErrors.ValidationResultsPairs;
    const errorsFoundByLineId = checkForErrors?.filter(index => index.LineId === lineId);
    if (errorsFoundByLineId !== undefined) {
        for (const i of errorsFoundByLineId) {
            if (ArrayExtensions.hasElements(i.ValidationFailures)) {
                i.ValidationFailures.forEach(validation => {
                    if (validation.ErrorContext !== undefined) {
                        finalErrorMessages.push(validation.ErrorContext);
                    }
                });
            }
        }
    }

    if (ArrayExtensions.hasElements(finalErrorMessages)) {
        return finalErrorMessages.join(' ');
    }

    return undefined;
};

/**
 * On Remove Click functionality.
 * @param removeItemClickHandler -Remove item click function.
 * @param cartline -CartLine.
 * @returns Remove change value.
 */
const onRemoveClickFunction = (removeItemClickHandler: (cartlineToRemove: CartLine) => void, cartline: CartLine) => () => {
    removeItemClickHandler(cartline);
};

// eslint-disable-next-line complexity -- Auto-suppressed.
const _assembleNode = (
    cartline: CartLine,
    product: SimpleProduct | undefined,
    props: ICartLineItemsProps,
    index: number,
    foundProductAvailability?: IProductInventoryInformation,
    productPickUpOptions?: ProductDeliveryOptions
): ICartlinesViewProps => {
    const {
        imageSettings,
        gridSettings,
        id,
        typeName,
        context,
        resources,
        removeButtonText,
        removeItemClickHandler,
        moveToWishlistSuccessHandler,
        addToOrderTemplateButtonText,
        addToOrderTemplateButtonTooltip,
        addToOrderTemplateDialogResources,
        createOrderTemplateDialogResources,
        itemAddedToOrderTemplateDialogResources,
        duplicateItemsWhenAddingToOrderTemplateDialogResources,
        addToWishlistButtonText,
        removeFromWishlistButtonText,
        orderTemplates,
        customerInformation,
        wishlists,
        defaultWishlistName,
        storeSelectorModuleId,
        isMultipleCatalogFeatureEnabledInHq
    } = props;

    const isAuthenticated = context.request.user.isAuthenticated;
    const nameOfWishlist = wishlists && wishlists.length > 0 && wishlists[0].Name ? wishlists[0].Name : defaultWishlistName;
    const availableQuantityInStock = _getCartItemAvailableQuantity(props.isStockCheckEnabled, foundProductAvailability);

    const maxQuantity =
        product &&
        _getCartItemMaxQuantity(
            props.maxCartlineQuantity,
            props.isStockCheckEnabled,
            availableQuantityInStock,
            props.isQuantityLimitsFeatureEnabled,
            product?.Behavior?.MaximumQuantity || 0
        );

    // Skip stock check if the cart line is a service item or an invoice line
    const shouldSkipStockCheck = product?.ItemTypeValue === ReleasedProductType.Service || !!cartline.IsInvoiceLine;

    const errorMessage = ObjectExtensions.isNullOrUndefined(maxQuantity)
        ? undefined
        : _getErrorMessage(
              availableQuantityInStock,
              cartline.Quantity!,
              props,
              shouldSkipStockCheck,
              cartline,
              cartline.LineId,
              foundProductAvailability
          );

    const onRemoveClickHandler = onRemoveClickFunction(removeItemClickHandler, cartline);

    const payload = getPayloadObject(TelemetryEvent.RemoveFromCart, props.telemetryContent!, removeButtonText, '');
    const attributes = getTelemetryAttributes(props.telemetryContent!, payload);

    const inventoryLbl = foundProductAvailability?.StockLevelLabel;
    const inventoryCode = foundProductAvailability
        ? `ms-cart-line__inventory-code-${foundProductAvailability.StockLevelCode?.toLowerCase()}`
        : undefined;
    const productDimension = 4;
    const customPriceDimensionType = productDimension as ProductDimensionType.Style;
    const isCustomPriceSelected =
        product?.Dimensions?.find(dimension => dimension.DimensionTypeValue === customPriceDimensionType)?.DimensionValue?.Value ===
        'Custom';

    let productUrl: string | undefined;
    if (product) {
        productUrl = getProductUrlSync(product, props.context.actionContext, undefined);

        if (MsDyn365.isBrowser && isChannelTypeB2B(props.context.actionContext.requestContext)) {
            const fullUrl = new URL(productUrl, window.location.href);
            fullUrl.searchParams.set('catalogid', `${cartline.CatalogId ?? 0}`);
            productUrl = fullUrl.href;
        }
    } else {
        productUrl = getInvoiceDetailsPageUrlSync(cartline.Description || '', props.context.actionContext);
    }

    return {
        data: {
            product,
            cartline
        },
        cartlineId: cartline.LineId,
        error: errorMessage,
        hasError:
            (!shouldSkipStockCheck && props.isStockCheckEnabled ? cartline.Quantity! > (maxQuantity ?? 0) : false) ||
            (!ObjectExtensions.isNullOrUndefined(errorMessage) && !StringExtensions.isNullOrEmpty(errorMessage)),
        cartline: (
            <CartLineItemComponent
                data={{
                    cartLine: cartline,
                    cartState: props.cartState,
                    product,
                    catalogs: props.catalogs
                }}
                currentQuantity={cartline.Quantity}
                maxQuantity={maxQuantity}
                isOutOfStock={!shouldSkipStockCheck && props.isStockCheckEnabled ? availableQuantityInStock <= 0 : false}
                gridSettings={gridSettings}
                imageSettings={imageSettings}
                id={id}
                typeName={typeName}
                productUrl={productUrl}
                context={context}
                resources={resources}
                key={`${index}-${productUrl}`}
                lineIndex={index}
                isQuantityEditable={!ObjectExtensions.isNullOrUndefined(product)}
                quantityOnChange={props.updateCartLinesQuantitySuccessHandler}
                primaryImageUrl={product?.PrimaryImageUrl}
                errorMessage={errorMessage}
                inventoryInformationLabel={inventoryLbl}
                inventoryLabelClassName={inventoryCode}
                isCartStateReady={props.cartState?.status === 'READY'}
                showShippingChargesForLineItems={props.showShippingChargesForLineItems}
                telemetryContent={props.telemetryContent}
                channelDeliveryOptionConfig={props.channelDeliveryOptionConfig}
                priceCurrency={context.request.channel?.Currency}
            />
        ),
        pickUpInStore: product
            ? PickUpInStore({
                  storeSelectorModuleId,
                  cartState: props.cartState,
                  cartline,
                  product,
                  shipitText: props.shipItText,
                  pickUpInStoreText: props.pickitUpText,
                  changeStoreText: props.changeStoreText,
                  storeSelectorStateManager: props.storeSelectorStateManager,
                  orgUnitLocations: props.orgUnitLocations,
                  deliveryOptions: productPickUpOptions,
                  pickupDeliveryModeCode:
                      cartline.DeliveryMode !== (undefined || '') ? cartline.DeliveryMode : props.pickupDeliveryModeCode,
                  retailMulitplePickupFeatureState: props.retailMulitplePickupFeatureState,
                  channelDeliveryOptionConfig: props.channelDeliveryOptionConfig,
                  locationChangedHandler: props.locationChangedHandler
              })
            : undefined,
        remove: (
            <Button className='msc-cart-line__remove-item' onClick={onRemoveClickHandler} title={removeButtonText} {...attributes}>
                {removeButtonText}
            </Button>
        ),
        addToWishlist:
            isAuthenticated && product && !isCustomPriceSelected ? (
                <AddToWishlistComponent
                    className='msc-cart-line__add-to-wishlist'
                    addToWishlistButtonText={addToWishlistButtonText}
                    removeFromWishlistButtonText={removeFromWishlistButtonText}
                    context={context}
                    id={id}
                    key={cartline.LineId}
                    typeName={typeName}
                    nameOfWishlist={nameOfWishlist}
                    cartline={cartline}
                    showButtonText
                    showStatusMessage={false}
                    showRemoveButton={false}
                    showButtonTooltip={false}
                    ariaRole='button'
                    data={{
                        wishlists,
                        product
                    }}
                    onSuccess={moveToWishlistSuccessHandler}
                />
            ) : (
                undefined
            ),
        addToOrderTemplate:
            isAuthenticated && orderTemplates && product ? (
                <AddToOrderTemplateComponent
                    className={classnames('msc-cart-line__add-to-order-template', isCustomPriceSelected ? 'disabled' : '')}
                    addToOrderTemplateButtonText={addToOrderTemplateButtonText}
                    addToOrderTemplateButtonTooltip={addToOrderTemplateButtonTooltip}
                    addToOrderTemplateDialogResources={addToOrderTemplateDialogResources}
                    createOrderTemplateDialogResources={createOrderTemplateDialogResources}
                    itemAddedToOrderTemplateDialogResources={itemAddedToOrderTemplateDialogResources}
                    duplicateItemsWhenAddingToOrderTemplateDialogResources={duplicateItemsWhenAddingToOrderTemplateDialogResources}
                    data={{ product, quantity: cartline.Quantity || 1, orderTemplates, customerInformation }}
                    context={context}
                    showButtonText
                    shouldShowButtonFailedTooltip={isCustomPriceSelected}
                    disableButton={isCustomPriceSelected}
                    id={id}
                    typeName={typeName}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- App config settings are of "any" value
                    showButtonTooltip={!props.context.app.config.disableTooltip || false}
                    imageSettings={props.imageSettings !== undefined ? props.imageSettings : undefined}
                    isMultipleCatalogFeatureEnabledInHq={isMultipleCatalogFeatureEnabledInHq || false}
                    catalogId={cartline.CatalogId}
                />
            ) : (
                undefined
            )
    };
};

export const assembleCartlines = (
    cartlines: CartLine[],
    products: SimpleProduct[] | undefined,
    props: ICartLineItemsProps
): ICartlinesViewProps[] | null => {
    const reactNodes: ICartlinesViewProps[] = [];

    cartlines.map((cartline, index) => {
        let product;
        if (props.isQuantityLimitsFeatureEnabled) {
            // When feature is enabled the same products could have different quantity limits in Behavior so we need
            // to check productId and WarehouseId for identification.
            product = getProductByProductIdAndWarehouse(cartline.ProductId, products, cartline.WarehouseId, props.cartState);
        } else {
            product = getProductByProductId(cartline.ProductId, products);
        }
        let foundProductAvailability;

        // check if cartlineitem is pickup item
        const isPickUpItem = isCartLineItemPickUpType(
            cartline,
            props.retailMulitplePickupFeatureState,
            props.channelDeliveryOptionConfig,
            props.pickupDeliveryModeCode
        );
        if (props.productAvailabilites && ArrayExtensions.hasElements(props.productAvailabilites)) {
            foundProductAvailability = props.productAvailabilites.find(productAvailability => {
                if (!props.shouldIgnoreWarehouse && isPickUpItem) {
                    // check warehouse only if siteBuilder setting is not "Based on aggregate for shipping and pickup warehouses" and cartlineitem is pickupitem
                    return (
                        productAvailability.ProductAvailableQuantity?.ProductId === cartline.ProductId &&
                        productAvailability.InventLocationId?.toUpperCase() === cartline.WarehouseId?.toUpperCase()
                    );
                }
                return productAvailability.ProductAvailableQuantity.ProductId === cartline.ProductId;
            });
        }

        let productPickUpOptions;
        if (props.productPickUpOptions !== undefined && ArrayExtensions.hasElements(props.productPickUpOptions)) {
            productPickUpOptions = props.productPickUpOptions.find(deliveryOption => {
                return deliveryOption && deliveryOption.ProductId === cartline.ProductId;
            });
        }
        reactNodes.push(_assembleNode(cartline, product, props, index, foundProductAvailability, productPickUpOptions));
    });

    return reactNodes;
};

/**
 * CartLineItems component.
 * @param props
 */
export const CartLineItems = (props: ICartLineItemsProps) => {
    const { products, cartlines } = props;
    return assembleCartlines(cartlines, products, props);
};
