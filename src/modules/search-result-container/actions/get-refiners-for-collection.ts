/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IProductRefinerHierarchy } from '@msdyn365-commerce/commerce-entities';
import { createObservableDataAction, IAction, IActionContext, IActionInput, ICreateActionContext } from '@msdyn365-commerce/core';
import { AsyncResult, ChannelInventoryConfiguration, ProductRefinerValue, ProductSearchCriteria } from '@msdyn365-commerce/retail-proxy';
import { getInventoryConfigurationAsync } from '@msdyn365-commerce/retail-proxy/dist/DataActions/StoreOperationsDataActions.g';

import { BaseCollectionInput, createBaseCollectionInput } from './base-collection-action';
import { getProductRefinerHierarchy } from './get-product-refiner-hierarchy';
import { getInventorySortableRefinerValue, ProductListInventoryFilteringOptions } from '.';

/**
 * Default Category/Product Id Values.
 */
enum DefaultValues {
    defaultCategoryIdValue = 0,
    defaultProductIdValue = 0
}

/**
 * Refiners-by-Collection Input action.
 */
export class RefinersByCollectionInput extends BaseCollectionInput implements IActionInput {
    public getCacheObjectType = () => 'ProductRefiner';

    public dataCacheType = () => {
        if (
            this.pageType !== 'Category' ||
            (this.refiners && this.refiners.length > 0) ||
            (this.queryResultSettings &&
                this.queryResultSettings.Sorting &&
                this.queryResultSettings.Sorting.Columns &&
                this.queryResultSettings.Sorting.Columns.length > 0)
        ) {
            return 'request';
        }
        return 'application';
    };
}

/**
 * Create input method which creates an ActionInput for fetching list page refiners.
 * @param args
 */
const createInput = (args: ICreateActionContext): IActionInput => {
    return createBaseCollectionInput(args, RefinersByCollectionInput);
};

/**
 * Action method which fetches refiners for the given list page.
 * @param input
 * @param context
 */
async function action(input: RefinersByCollectionInput, context: IActionContext): Promise<IProductRefinerHierarchy[]> {
    let searchProductId;
    // Decouple refiners from input.refiners to avoid input.refiners being modified below
    let refiners: ProductRefinerValue[] = [...input.refiners] || [];

    let channelInventoryConfigurationPromise: AsyncResult<ChannelInventoryConfiguration>;
    if (input.channelInventoryConfiguration) {
        channelInventoryConfigurationPromise = AsyncResult.resolve(input.channelInventoryConfiguration);
    } else {
        channelInventoryConfigurationPromise = getInventoryConfigurationAsync({ callerContext: context });
    }
    const channelInventoryConfiguration = await channelInventoryConfigurationPromise;

    // Replace InventoryProductAttribute with boolean refiner.
    // Because the value of InventoryProductAttribute is different from language to language since it's string type.
    // The cached old inventory refiner value may be hit when customer switch language which will lead to "no products found" issue.
    const inventoryRefiner = refiners.find(
        refiner => refiner.RefinerRecordId === channelInventoryConfiguration?.InventoryProductAttributeRecordId
    );
    if (inventoryRefiner) {
        refiners = refiners.filter(refiner => refiner.RefinerRecordId !== channelInventoryConfiguration?.InventoryProductAttributeRecordId);

        const isInStockRefiner =
            inventoryRefiner.LeftValueBoundString !== channelInventoryConfiguration?.InventoryOutOfStockAttributeValueText &&
            inventoryRefiner.RightValueBoundString !== channelInventoryConfiguration?.InventoryOutOfStockAttributeValueText;
        const inventoryRefinerValue = getInventorySortableRefinerValue(channelInventoryConfiguration, isInStockRefiner);

        const isInventoryRefinerValueExist = refiners.some(refiner => refiner.RefinerRecordId === inventoryRefinerValue?.RefinerRecordId);
        if (!isInventoryRefinerValueExist && inventoryRefinerValue) {
            refiners.push(inventoryRefinerValue);
        }
    }

    if (context.requestContext.app.config?.productListInventoryDisplay === ProductListInventoryFilteringOptions.HideOOS) {
        const isInStock = true;
        const inventoryInStockRefinerValue = getInventorySortableRefinerValue(channelInventoryConfiguration, isInStock);

        const isInventoryInStockRefinerValueExist = refiners.some(
            refiner => refiner.RefinerRecordId === inventoryInStockRefinerValue?.RefinerRecordId
        );
        if (!isInventoryInStockRefinerValueExist && inventoryInStockRefinerValue) {
            refiners.push(inventoryInStockRefinerValue);
        }
    }

    if (input.pageType === 'Category') {
        if (input.category) {
            return getProductRefinerHierarchy(
                {
                    CategoryIds: [input.category || DefaultValues.defaultCategoryIdValue],
                    Context: {
                        ChannelId: input.apiSettings.channelId,
                        CatalogId: input.catalogId
                    },
                    Refinement: input.isUpdateRefinerPanel ? refiners : []
                },
                input.queryResultSettings,
                context
            );
        }
        throw new Error('[GetRefinersForCollection]Category Page Detected, but no global categoryId found');
    } else {
        if (input.searchText && context.requestContext.query && context.requestContext.query.q) {
            return getProductRefinerHierarchy(
                {
                    SearchCondition: input.searchText,
                    Context: {
                        ChannelId: input.apiSettings.channelId,
                        CatalogId: input.catalogId
                    },
                    Refinement: input.isUpdateRefinerPanel ? refiners : []
                },
                input.queryResultSettings,
                context
            );
        }
        if (input.searchText && context.requestContext.query && context.requestContext.query.recommendation) {
            const searchObject = JSON.parse(input.searchText);
            if (context.requestContext.query.productId) {
                searchProductId = Number(searchObject.ProductId);
            }
            if (Number.isNaN(searchProductId)) {
                throw new Error('Failed to cast search product id into a number.');
            } else if (!searchObject.Recommendation) {
                throw new Error('Failed to retrieve the Recommendation.');
            } else {
                const searchCriteriaInput: ProductSearchCriteria = {};
                searchCriteriaInput.Context = {
                    ChannelId: input.apiSettings.channelId,
                    CatalogId: input.catalogId
                };
                searchCriteriaInput.Refinement = input.isUpdateRefinerPanel ? refiners : [];
                searchCriteriaInput.RecommendationListId = searchObject.Recommendation;
                if (searchProductId) {
                    searchCriteriaInput.Ids = [searchProductId || DefaultValues.defaultProductIdValue];
                }
                return getProductRefinerHierarchy(searchCriteriaInput, input.queryResultSettings, context);
            }
        } else {
            throw new Error('[GetFullProductsForCollection]Search Page Detected, but no q= or productId= query parameter found');
        }
    }
}

export const actionDataAction = createObservableDataAction({
    id: '@msdyn365-commerce-modules/search-result-container/get-refiners-for-collection',
    action: <IAction<IProductRefinerHierarchy[]>>action,
    input: createInput
});

export default actionDataAction;
