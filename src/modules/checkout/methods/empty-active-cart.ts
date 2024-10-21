/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IActionContext } from '@msdyn365-commerce/core';
import { EmptyActiveCart } from '@msdyn365-commerce-modules/checkout';

async function emptyActiveCart(ctx: IActionContext): Promise<void> {
    return EmptyActiveCart(ctx);
}

export default emptyActiveCart;
