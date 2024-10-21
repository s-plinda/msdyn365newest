/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { CartLine, SimpleProduct } from '@msdyn365-commerce/retail-proxy';
import groupBy from 'lodash/groupBy';

import { assembleCartlines, ICartLineItemsProps, ICartlinesViewProps } from './cart-line-items';

const _assembleGroupCartlines = (
    cartlines: CartLine[],
    products: SimpleProduct[] | undefined,
    props: ICartLineItemsProps
): ICartlinesViewProps[][] | null => {
    const reactNodes: ICartlinesViewProps[][] = [];
    if (!products || products.length === 0) {
        props.context.telemetry.error('Products content is empty, module wont render');
        return null;
    }

    const getGroupByStorePickup = (items: CartLine[]) => groupBy(items, item => item.FulfillmentStoreId);
    const getGroupByDelivery = (items: CartLine[]) => groupBy(items, item => item.DeliveryMode);
    const groupDelivery = getGroupByDelivery(cartlines);
    const cartLinesGroup: CartLine[] = [];

    // 1) Group by store and pick up mode
    Object.entries(groupDelivery).forEach(([deliveryType, groupByDeliveryType]) => {
        // @ts-expect-error
        groupDelivery[deliveryType] = getGroupByStorePickup(groupByDeliveryType);
        cartLinesGroup.push(getGroupByStorePickup(groupByDeliveryType));
    });

    // 2) Create cartlines group
    Object.keys(cartLinesGroup).forEach(key => {
        const cartLines = cartLinesGroup[key];
        Object.keys(cartLines).forEach(index => {
            const cartLine = cartLines[index];
            const carLineViewProps = assembleCartlines(cartLine, products, props);
            if (carLineViewProps !== null) {
                reactNodes.push(carLineViewProps);
            }
        });
    });

    return reactNodes;
};

const _assembleGroupInvoiceCartlines = (
    cartLines: CartLine[],
    products: SimpleProduct[] | undefined,
    props: ICartLineItemsProps
): ICartlinesViewProps[][] | null => {
    const reactNodes: ICartlinesViewProps[][] = [];
    if (cartLines && cartLines.length > 0) {
        // Create invoice cartLines group
        const carLineViewProps = assembleCartlines(cartLines, products, props);
        if (carLineViewProps !== null) {
            reactNodes.push(carLineViewProps);
        }
    }
    return reactNodes;
};

/**
 * CartLine Group component.
 * @param props
 */
export const CartLineGroupItems = (props: ICartLineItemsProps) => {
    const { products, cartlines, hasInvoiceLine } = props;
    return hasInvoiceLine
        ? _assembleGroupInvoiceCartlines(cartlines, products, props)
        : _assembleGroupCartlines(cartlines, products, props);
};
