/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IActionContext } from '@msdyn365-commerce/core';
import { CartPromotionLine } from '@msdyn365-commerce/retail-proxy';
import { getPromotionOptionsForCartLineItems, PromotionOptionsForCartLineItems } from '@msdyn365-commerce-modules/retail-actions';

/**
 * IPromotionData entity interface.
 */
export interface IPromotionData {
    promotionOptions?: CartPromotionLine[];
}

/**
 * Calls the Retail API and returns a promotion data.
 * @param ctx
 */
export async function getPromotionData(ctx: IActionContext): Promise<IPromotionData> {
    const promotionData: IPromotionData = {};

    await getPromotionOptionsForCartLineItems(new PromotionOptionsForCartLineItems(ctx.requestContext.apiSettings), ctx)
        .then(promotionOptions => {
            if (promotionOptions) {
                promotionData.promotionOptions = promotionOptions;
            }
        })
        .catch(error => {
            ctx.telemetry.exception(error);
            return {};
        });

    return promotionData;
}
