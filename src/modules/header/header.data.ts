/*--------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See License.txt in the project root for license information.
 *--------------------------------------------------------------*/

/* eslint-disable no-duplicate-imports */
import { ICartState } from '@msdyn365-commerce/global-state';
import { AsyncResult, CommerceList, Customer, Employee } from '@msdyn365-commerce/retail-proxy';
import { IStoreSelectorStateManager } from '@msdyn365-commerce-modules/bopis-utilities';

export interface IHeaderData {
    cart: AsyncResult<ICartState>;
    employee: AsyncResult<Employee>;
    accountInformation: AsyncResult<Customer>;
    storeSelectorStateManager: AsyncResult<IStoreSelectorStateManager>;
    wishlists?: AsyncResult<CommerceList[]>;
}
