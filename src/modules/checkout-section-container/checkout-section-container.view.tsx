/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { Module, Node } from '@msdyn365-commerce-modules/utilities';
import * as React from 'react';

import { ICheckoutSectionContainerItem, ICheckoutSectionContainerViewProps } from './checkout-section-container';

const ItemComponent: React.FC<ICheckoutSectionContainerItem> = ({ loading, itemProps, item }) => (
    <>
        {loading}
        <Node {...itemProps}>0000{item}</Node>
    </>
);

const CheckoutSectionContainerView: React.FC<ICheckoutSectionContainerViewProps> = ({ checkoutPlainContainerProps, items }) => (
    <Module {...checkoutPlainContainerProps}>
        {items.map(item => (
            <ItemComponent key={item.id} {...item} />
        ))}
    </Module>
);

export default CheckoutSectionContainerView;
