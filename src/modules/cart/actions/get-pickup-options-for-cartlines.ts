/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import {
    CacheType,
    createObservableDataAction,
    IAction,
    IActionContext,
    IActionInput,
    IAny,
    ICommerceApiSettings,
    ICreateActionContext,
    IGeneric
} from '@msdyn365-commerce/core';
import { getCartState } from '@msdyn365-commerce/global-state';
import { ProductDeliveryOptions, ProductsDataActions } from '@msdyn365-commerce/retail-proxy';
import {
    ArrayExtensions,
    ActiveCartProductsInput,
    QueryResultSettingsProxy,
    buildCacheKey,
    getActiveCartProductsAction
} from '@msdyn365-commerce-modules/retail-actions';

/**
 * Input class for pickup delivery options for items in cart.
 */
export class ProductPickUpOptionsForCartLineItems implements IActionInput {
    public readonly apiSettings: ICommerceApiSettings;

    public constructor(apiSettings: ICommerceApiSettings) {
        this.apiSettings = apiSettings;
    }

    /**
     * Get Cache Key.
     * @returns - Cache key string.
     */
    public getCacheKey = (): string => buildCacheKey('ActiveCartLineItemsPickUpOptions', this.apiSettings);

    /**
     * Get Cachetype Name.
     * @returns - Cache name string.
     */
    public getCacheObjectType = (): string => 'ActiveCartLineItemsPickUpOptions';

    /**
     * Get Cachetype.
     * @returns - CacheType enum.
     */
    public dataCacheType = (): CacheType => 'none';
}

/**
 * CreateInput method for the GetPickUpOptionCartLineItems method.
 * @param inputData - The input data passed to the createInput method.
 * @returns - Input for data action.
 */
const createInput = (inputData: ICreateActionContext<IGeneric<IAny>>) => {
    return new ProductPickUpOptionsForCartLineItems(inputData.requestContext.apiSettings);
};

/**
 * The action method for the GetPickUpOptionCartLineItems data action.
 * @param input - The action input.
 * @param context - The action context.
 * @returns - Order Template object.
 */
export async function getPickUpOptionsForCartLineItems(
    input: ProductPickUpOptionsForCartLineItems,
    context: IActionContext
): Promise<ProductDeliveryOptions[]> {
    // If no input is provided fail out
    if (!input.apiSettings.channelId) {
        throw new Error('[getPickUpOptionsForCartLineItems]No valid Input was provided, failing');
    }
    const cartState = await getCartState(context);
    const cart = cartState.cart;
    const products = await getActiveCartProductsAction(new ActiveCartProductsInput(), context);
    const filterOption = 4;
    const response: ProductDeliveryOptions[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- existing code.
    if (cart === undefined || !ArrayExtensions.hasElements(products)) {
        return Promise.resolve(response);
    }

    const pickupoptions = await ProductsDataActions.getDeliveryOptionsAsync(
        {
            callerContext: context,
            queryResultSettings: QueryResultSettingsProxy.getPagingFromInputDataOrDefaultValue(context)
        },
        products.map(product => product.RecordId),
        {},
        filterOption
    );

    return pickupoptions;
}

/**
 * The GetPickupOptionCartLineItems Data Action
 * Returns pickup options.
 */
export const getPickUpOptionsForCartLineItemsDataAction = createObservableDataAction({
    id: '@msdyn365-commerce-modules/retail-actions/get-pickup-options-for-cartlines',
    action: getPickUpOptionsForCartLineItems as IAction<ProductDeliveryOptions[]>,
    input: createInput
});

export default getPickUpOptionsForCartLineItemsDataAction;
