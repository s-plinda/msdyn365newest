/*--------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * See License.txt in the project root for license information.
 *--------------------------------------------------------------*/

/* eslint-disable no-duplicate-imports */
import { AsyncResult, FeatureState } from '@msdyn365-commerce/retail-proxy';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/**
 * Interface for product collection data.
 * @param {AsyncResult<FeatureState[]>} featureState - The feature state.
 */
export interface IProductCollectionData {
    featureState: AsyncResult<FeatureState[]>;
}
