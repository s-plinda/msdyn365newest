/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IActionContext } from '@msdyn365-commerce/core';
import { ICheckoutState } from '@msdyn365-commerce/global-state';
import { SimpleProduct } from '@msdyn365-commerce/retail-proxy';
import { PlaceOrder } from '@msdyn365-commerce-modules/checkout';

export default async (
    ctx: IActionContext,
    checkoutState: ICheckoutState | undefined,
    orderedProducts: SimpleProduct[] | undefined,
    redirect: boolean,
    updatedCartVersion?: number,
    isPaymentVerificationRedirection?: boolean
) => {
    return PlaceOrder(ctx, checkoutState, orderedProducts, redirect, updatedCartVersion, isPaymentVerificationRedirection);
};
