/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import {
    CacheType,
    createObservableDataAction,
    GetCustomerInput,
    IAction,
    IActionContext,
    IActionInput,
    ICreateActionContext
} from '@msdyn365-commerce/core';
import { AsyncResult, ChannelInventoryConfiguration, ProductSearchCriteria, ProductSearchResult } from '@msdyn365-commerce/retail-proxy';
import { getProductPromotionsAsync, searchByCriteriaAsync } from '@msdyn365-commerce/retail-proxy/dist/DataActions/ProductsDataActions.g';
import { getInventoryConfigurationAsync } from '@msdyn365-commerce/retail-proxy/dist/DataActions/StoreOperationsDataActions.g';
import { ArrayExtensions, generateProductImageUrl, getCustomer, InventoryLevels } from '@msdyn365-commerce-modules/retail-actions';

import { BaseCollectionInput, createBaseCollectionInput } from './base-collection-action';
import { getInventorySortableRefinerValue } from '.';

/**
 * GetFullProductsByCollection Action Input.
 */
export class GetFullProductsByCollectionInput extends BaseCollectionInput implements IActionInput {
    /**
     * The cache object type.
     * @returns The cache object type.
     */
    public getCacheObjectType = (): string => 'FullProductSearchResult';

    /**
     * The data cache type.
     * @returns The data cache type.
     */
    public dataCacheType = (): CacheType => {
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
 * This setting defines inventory filtering options.
 */
export enum ProductListInventoryFilteringOptions {
    /**
     * Filter out all products out of stock.
     */
    HideOOS = 'hideOOS',

    /**
     * Sort products by availability, OOS goes last.
     */
    SortOOS = 'sortOOS',

    /**
     * No filtering selected.
     */
    Default = 'default'
}

/**
 * The full product search result with count interface.
 */
export interface IFullProductsSearchResultsWithCount {
    products: ProductSearchResult[];
    count: number;
    channelInventoryConfigurationId?: number;
    inventoryAwareSortableAttributeId?: number;
}

/**
 * CreateInput function which creates and actionInput used to fetch products for a list page.
 * @param args - The API arguments.
 * @returns IActionInput - The action input.
 */
const createInput = (args: ICreateActionContext<{ itemsPerPage: number; includedAttributes: boolean | undefined }>): IActionInput => {
    const input = createBaseCollectionInput(args, GetFullProductsByCollectionInput);

    // Set Top
    if (input.queryResultSettings.Paging && args.config) {
        input.queryResultSettings.Paging.Top = args.config.itemsPerPage || 1;
    }

    // Set Skip
    if (input.queryResultSettings.Paging && args.requestContext.query && args.requestContext.query.skip) {
        input.queryResultSettings.Paging.Skip = +args.requestContext.query.skip;
    }

    input.queryResultSettings.count = true;

    return input;
};

/**
 * Returns list of products based on inventory information.
 * @param  productSearchResults - The products.
 * @param  context - The context.
 * @param  metadataCount - The metadata count.
 * @param channelInventoryConfiguration - The channel inventory configuration.
 * @returns List of product based on the inventory information.
 */
export async function returnProducts(
    productSearchResults: ProductSearchResult[],
    context: IActionContext,
    metadataCount: number | undefined,
    channelInventoryConfiguration?: ChannelInventoryConfiguration
): Promise<IFullProductsSearchResultsWithCount> {
    const defaultProductCount: number = 0;

    const productSearchResultsWithImages = productSearchResults.map(productSearchResult => {
        const newImageUrl = generateProductImageUrl(productSearchResult, context.requestContext.apiSettings);

        if (newImageUrl) {
            productSearchResult.PrimaryImageUrl = newImageUrl;
        }

        return productSearchResult;
    });

    // If inventory level is threshold or inventory check is disabled then return the list of products without the inventory configuration
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- read config file.
    if (
        context.requestContext.app.config.inventoryLevel === InventoryLevels.threshold ||
        context.requestContext.app.config.enableStockCheck === false
    ) {
        return {
            products: productSearchResultsWithImages,
            count: metadataCount ?? defaultProductCount
        };
    }

    const mappedProducts = productSearchResultsWithImages.map(productSearchResult => {
        if (ArrayExtensions.hasElements(productSearchResult.AttributeValues)) {
            for (const element of productSearchResult.AttributeValues) {
                if (
                    channelInventoryConfiguration &&
                    element.RecordId !== undefined &&
                    element.RecordId === channelInventoryConfiguration.InventoryProductAttributeRecordId &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- read config file.
                    context.requestContext.app.config.inventoryRanges !== 'all' &&
                    element.TextValue !== channelInventoryConfiguration.InventoryOutOfStockAttributeValueText
                ) {
                    // If same RecordId then it means that is the Inventory attribute
                    // Based on the inventory range (and filtering options), the inventory label will be displayed
                    // If Inventory range is 'All' then in stock and out of stock labels are shown, else only OOS
                    // if the text value is different that the channelInventoryConfiguration.InventoryOutOfStockAttributeValueText then is in stock
                    element.TextValue = '';
                }
            }
        }

        return productSearchResult;
    });

    return {
        products: mappedProducts,
        count: metadataCount ?? defaultProductCount,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- check config.
        channelInventoryConfigurationId: channelInventoryConfiguration
            ? channelInventoryConfiguration.InventoryProductAttributeRecordId
            : undefined,
        inventoryAwareSortableAttributeId: channelInventoryConfiguration
            ? channelInventoryConfiguration.ProductAvailabilitySortableAttributeRecordId
            : undefined
    };
}

/**
 * Action function to fetch products for a list page.
 * @param input - The input.
 * @param context - The context.
 * @returns IFullProductsSearchResultsWithCount - The full product search result with count.
 */
// eslint-disable-next-line complexity -- ignore the complexity.
async function action(input: GetFullProductsByCollectionInput, context: IActionContext): Promise<IFullProductsSearchResultsWithCount> {
    let promise: AsyncResult<ProductSearchResult[]>;
    let channelInventoryConfigurationPromise: AsyncResult<ChannelInventoryConfiguration>;
    let searchProductId;
    const searchCriteriaInput: ProductSearchCriteria = {};
    searchCriteriaInput.Context = { ChannelId: context.requestContext.apiSettings.channelId, CatalogId: input.catalogId };
    // Decouple searchCriteriaInput.Refinement from input.refiners to avoid input.refiners being modified below
    searchCriteriaInput.Refinement = [...input.refiners];
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_CLOUD_SEARCH?.toLowerCase() !== 'true') {
        searchCriteriaInput.IncludeAttributes = false;
    } else {
        searchCriteriaInput.IncludeAttributes = input.includeAttributes;
    }
    searchCriteriaInput.SkipVariantExpansion = true;
    const defaultNumber: number = 0;

    if (input.channelInventoryConfiguration) {
        channelInventoryConfigurationPromise = AsyncResult.resolve(input.channelInventoryConfiguration);
    } else {
        channelInventoryConfigurationPromise = getInventoryConfigurationAsync({ callerContext: context });
    }
    const channelInventoryConfiguration = await channelInventoryConfigurationPromise;

    // Replace InventoryProductAttribute with boolean refiner.
    // Because the value of InventoryProductAttribute is different from language to language since it's string type.
    // The cached old inventory refiner value may be hit when customer switch language which will lead to "no products found" issue.
    const inventoryRefiner = searchCriteriaInput.Refinement.find(
        refiner => refiner.RefinerRecordId === channelInventoryConfiguration?.InventoryProductAttributeRecordId
    );
    if (inventoryRefiner) {
        searchCriteriaInput.Refinement = searchCriteriaInput.Refinement.filter(
            refiner => refiner.RefinerRecordId !== channelInventoryConfiguration?.InventoryProductAttributeRecordId
        );

        const isInStockRefiner =
            inventoryRefiner.LeftValueBoundString !== channelInventoryConfiguration?.InventoryOutOfStockAttributeValueText &&
            inventoryRefiner.RightValueBoundString !== channelInventoryConfiguration?.InventoryOutOfStockAttributeValueText;
        const inventoryRefinerValue = getInventorySortableRefinerValue(channelInventoryConfiguration, isInStockRefiner);

        const isInventoryRefinerValueExist = searchCriteriaInput.Refinement.some(
            refiner => refiner.RefinerRecordId === inventoryRefinerValue?.RefinerRecordId
        );
        if (!isInventoryRefinerValueExist && inventoryRefinerValue) {
            searchCriteriaInput.Refinement.push(inventoryRefinerValue);
        }
    }

    if (context.requestContext.app.config?.productListInventoryDisplay === ProductListInventoryFilteringOptions.HideOOS) {
        const isInStock = true;
        const inventoryInStockRefinerValue = getInventorySortableRefinerValue(channelInventoryConfiguration, isInStock);

        const isInventoryInStockRefinerValueExist = searchCriteriaInput.Refinement.some(
            refiner => refiner.RefinerRecordId === inventoryInStockRefinerValue?.RefinerRecordId
        );
        if (!isInventoryInStockRefinerValueExist && inventoryInStockRefinerValue) {
            searchCriteriaInput.Refinement.push(inventoryInStockRefinerValue);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- app configs are of generic type
    if (
        context.requestContext.app.config?.productListInventoryDisplay === ProductListInventoryFilteringOptions.SortOOS &&
        channelInventoryConfiguration.ProductAvailabilitySortableAttributeRecordId
    ) {
        input.queryResultSettings.Sorting = input.queryResultSettings.Sorting ?? {};
        input.queryResultSettings.Sorting.Columns = input.queryResultSettings.Sorting.Columns ?? [];
        const sortColumnName = `Attr_${channelInventoryConfiguration.ProductAvailabilitySortableAttributeRecordId}`;
        const isSortAttributeExist = input.queryResultSettings.Sorting.Columns.some(column => column.ColumnName === sortColumnName);
        if (!isSortAttributeExist) {
            input.queryResultSettings.Sorting.Columns.push({
                ColumnName: sortColumnName,
                IsDescending: true
            });
        }
    }

    if (input.pageType === 'Category' || context.requestContext.query?.categoryId) {
        if (input.category) {
            searchCriteriaInput.CategoryIds = [input.category || defaultNumber];
            promise = searchByCriteriaAsync(
                {
                    callerContext: context,
                    queryResultSettings: input.queryResultSettings
                },
                searchCriteriaInput
            );
        } else {
            throw new Error('[GetFullProductsForCollection]Category Page Detected, but no global categoryId found');
        }
    } else if (input.searchText && context.requestContext.query?.q) {
        searchCriteriaInput.SearchCondition = input.searchText;
        promise = searchByCriteriaAsync(
            {
                callerContext: context,
                queryResultSettings: input.queryResultSettings
            },
            searchCriteriaInput
        );
    } else if (input.searchText && context.requestContext.query && context.requestContext.query.recommendation) {
        const searchObject = JSON.parse(input.searchText);
        if (context.requestContext.query.productId) {
            searchProductId = Number(searchObject.ProductId);
        }
        if (Number.isNaN(searchProductId)) {
            throw new Error('Failed to cast search product id into a number.');
        } else if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Existing code
            !searchObject.Recommendation
        ) {
            throw new Error('Failed to retrieve the Recommendation.');
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- Existing code
            searchCriteriaInput.RecommendationListId = searchObject.Recommendation;
            if (searchProductId) {
                searchCriteriaInput.Ids = [searchProductId || defaultNumber];
            }
            promise = searchByCriteriaAsync(
                {
                    callerContext: context,
                    queryResultSettings: input.queryResultSettings
                },
                searchCriteriaInput
            );
        }
    } else if (input.searchText && context.requestContext.query?.discountIds) {
        const accountInformation = await getCustomer(new GetCustomerInput(context.requestContext.apiSettings), context);
        const discountIds = context.requestContext.query?.discountIds.split(',');

        const productPromotions = await getProductPromotionsAsync(
            {
                callerContext: context,
                queryResultSettings: input.queryResultSettings
            },
            discountIds ?? [],
            {
                HeaderContext: {
                    ChannelId: context.requestContext.apiSettings.channelId,
                    CustomerAccountNumber: accountInformation?.AccountNumber
                },
                LineContexts: [
                    {
                        CatalogId: input.catalogId
                    }
                ]
            },
            new Date()
        );

        const productIds = productPromotions.map(p => p.ProductId ?? 0);
        searchCriteriaInput.Ids = productIds;
        searchCriteriaInput.CustomerAccountNumber = accountInformation.AccountNumber;

        promise = searchByCriteriaAsync(
            {
                callerContext: context,
                queryResultSettings: input.queryResultSettings
            },
            searchCriteriaInput
        );
    } else {
        throw new Error('[GetFullProductsForCollection]Search Page Detected, but no q= or productId= query parameter found');
    }

    const productSearchResults = await promise;
    return returnProducts(productSearchResults, context, promise.metadata.count, channelInventoryConfiguration);
}

export const actionDataAction = createObservableDataAction({
    id: '@msdyn365-commerce-modules/search-result-container/get-full-products-by-collection',
    action: action as IAction<IFullProductsSearchResultsWithCount>,
    input: createInput
});

export default actionDataAction;
