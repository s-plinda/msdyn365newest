/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IActionContext } from '@msdyn365-commerce/core';
import { SalesOrder } from '@msdyn365-commerce/retail-proxy/dist/Entities/CommerceTypes.g';
import { CartCheckout } from '@msdyn365-commerce-modules/checkout';

export const OPERATIONS = {
    PayCard: 201,
    PayGiftCertificate: 214,
    PayLoyalty: 207,
    PayCustomerAccount: 202
};

export default async (
    ctx: IActionContext,
    updatedCartVersion?: number,
    isPaymentVerificationRedirection?: boolean
): Promise<SalesOrder> => {
    return CartCheckout(ctx, updatedCartVersion, isPaymentVerificationRedirection);
};
