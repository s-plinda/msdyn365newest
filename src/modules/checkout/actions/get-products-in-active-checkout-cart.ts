/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { CacheType, createObservableDataAction, IAction, IActionContext, IActionInput } from '@msdyn365-commerce/core';
import { getCheckoutState } from '@msdyn365-commerce/global-state';
import { SimpleProduct } from '@msdyn365-commerce/retail-proxy/dist/Entities/CommerceTypes.g';
import { getSimpleProducts, ProductInput } from '@msdyn365-commerce-modules/retail-actions';

/**
 * Input class for ActiveCheckoutCartWithProducts data action.
 */
export class ActiveCheckoutCartProductsInput implements IActionInput {
    public getCacheKey = () => 'ActiveCheckoutCartProducts';

    public getCacheObjectType = () => 'ActiveCheckoutCartProducts';

    public dataCacheType = (): CacheType => 'none';
}

export const createInput = () => {
    return new ActiveCheckoutCartProductsInput();
};

/**
 * Calls the Retail API and returns a cart object based on the passed GetCartInput.
 * @param input
 * @param ctx
 */
export async function getActiveCheckoutCartProductsAction(
    input: ActiveCheckoutCartProductsInput,
    ctx: IActionContext
): Promise<SimpleProduct[]> {
    // If no cart ID is provided in input, we need to create a cart object
    if (!input) {
        ctx.telemetry.exception(new Error('[getActiveCheckoutCartWithProducts]No valid Input was provided, failing'));
        throw new Error('[getActiveCheckoutCartWithProducts]No valid Input was provided, failing');
    }

    const checkoutState = await getCheckoutState(ctx);
    const cart = checkoutState.checkoutCart.cart;

    // If there are cart lines, make call to get products
    if (!checkoutState.checkoutCart.hasInvoiceLine && cart && cart.CartLines && cart.CartLines.length > 0) {
        return getSimpleProducts(
            <ProductInput[]>cart.CartLines.map(cartLine => {
                if (cartLine.ProductId) {
                    return new ProductInput(
                        cartLine.ProductId,
                        ctx.requestContext.apiSettings,
                        undefined,
                        undefined,
                        ctx.requestContext,
                        cartLine.CatalogId
                    );
                }
                return undefined;
            }).filter(Boolean),
            ctx
        )
            .then(products => {
                if (products) {
                    return products;
                }
                return [];
            })
            .catch(error => {
                ctx.telemetry.exception(error);
                throw new Error('[getActiveCheckoutCartWithProdcuts]Unable to hydrate cart with product information');
            });
    }

    return <SimpleProduct[]>[];
}

export const getActiveCheckoutCartProductsActionDataAction = createObservableDataAction({
    id: '@msdyn365-commerce-modules/checkout/get-products-in-active-checkout-cart',
    action: <IAction<SimpleProduct[]>>getActiveCheckoutCartProductsAction,
    input: createInput
});

export default getActiveCheckoutCartProductsActionDataAction;
