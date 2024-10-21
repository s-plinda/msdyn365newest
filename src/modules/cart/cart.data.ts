/*--------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See License.txt in the project root for license information.
 *--------------------------------------------------------------*/

/* eslint-disable no-duplicate-imports */
import { FullProduct } from '@msdyn365-commerce/commerce-entities';
import { ICartState } from '@msdyn365-commerce/global-state';
import {
    AsyncResult,
    CartConfiguration,
    CartPromotionLine,
    ChannelDeliveryOptionConfiguration,
    CommerceList,
    Customer,
    CustomerBalances,
    FeatureState,
    OrgUnitLocation,
    ProductCatalog,
    ProductDeliveryOptions,
    SimpleProduct
} from '@msdyn365-commerce/retail-proxy';
import { IStoreSelectorStateManager } from '@msdyn365-commerce-modules/bopis-utilities';
import { IProductInventoryInformation, OrderTemplate } from '@msdyn365-commerce-modules/retail-actions';

export interface ICartData {
    storeSelectorStateManager: AsyncResult<IStoreSelectorStateManager>;
    cart: AsyncResult<ICartState>;
    products: AsyncResult<SimpleProduct[]>;
    orgUnitLocations: AsyncResult<OrgUnitLocation[]>;
    productAvailabilites: AsyncResult<IProductInventoryInformation[]>;
    deliveryOptions: AsyncResult<ProductDeliveryOptions[]>;
    wishlists: AsyncResult<CommerceList[]>;
    wishlistItems: AsyncResult<FullProduct[]>;
    customerInformation: AsyncResult<Customer>;
    featureState: AsyncResult<FeatureState[]>;
    orderTemplates: AsyncResult<OrderTemplate[]>;
    promotionOptions: AsyncResult<CartPromotionLine[]>;
    channelDeliveryOptionConfig: AsyncResult<ChannelDeliveryOptionConfiguration>;
    catalogs?: AsyncResult<ProductCatalog[]>;
    cartLinesPickUpOptions?: AsyncResult<ProductDeliveryOptions[]>;
    customerBalances?: AsyncResult<CustomerBalances> | undefined;
    cartConfiguration?: AsyncResult<CartConfiguration>;
}
