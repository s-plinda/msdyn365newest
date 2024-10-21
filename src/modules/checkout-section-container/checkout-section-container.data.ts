/*--------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See License.txt in the project root for license information.
 *--------------------------------------------------------------*/

/* eslint-disable no-duplicate-imports */
import { ICheckoutState } from '@msdyn365-commerce/global-state';
import { AsyncResult } from '@msdyn365-commerce/retail-proxy';

/**
 * ICheckoutSectionContainerData interface.
 */
export interface ICheckoutSectionContainerData {
    checkout: AsyncResult<ICheckoutState>;
}
