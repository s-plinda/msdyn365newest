/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { CacheType, getCatalogId, IActionInput, IAny, ICommerceApiSettings, ICreateActionContext, IGeneric } from '@msdyn365-commerce/core';
import { IProductRefinerHierarchy } from '@msdyn365-commerce/commerce-entities';
import {
    convertToString,
    ChannelInventoryConfiguration,
    IQueryResultSettings,
    ProductRefinerValue,
    SortColumn
} from '@msdyn365-commerce/retail-proxy';
import { generateCacheKey, QueryResultSettingsProxy } from '@msdyn365-commerce-modules/retail-actions';
import { toJS } from 'mobx';

import { hydrateRefinersFromUrl } from './url-utils';

/**
 * Export listPageType.
 */
export type listPageType = 'Category' | 'Search' | 'Unknown';

/**
 * Get include attributes from config.
 * @param inputData - ICreateActionContext.
 * @returns Boolean.
 */
function getIncludeAttributes(inputData: ICreateActionContext<IGeneric<IAny>, IGeneric<IAny>>): boolean {
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_CLOUD_SEARCH?.toLowerCase() !== 'true') {
        return false;
    }

    if (inputData && inputData.config && inputData.config.includeAttributes !== undefined && inputData.config.includeAttributes === true) {
        return true;
    }
    return false;
}

/**
 * Get updateRefinerPanel from config.
 * @param inputData - ICreateActionContext.
 * @returns Boolean.
 */
function getUpdateRefinerPanel(inputData: ICreateActionContext<IGeneric<IAny>, IGeneric<IAny>>): boolean {
    return !!inputData.config?.updateRefinerPanel;
}

/**
 * BaseCollection Action Input.
 */
export class BaseCollectionInput implements IActionInput {
    public pageType: listPageType;

    public category: number | undefined;

    public searchText: string | undefined;

    public refiners: ProductRefinerValue[];

    public queryResultSettings: IQueryResultSettings;

    public apiSettings: ICommerceApiSettings;

    public includeAttributes: boolean | undefined;

    public locale?: string;

    public isUpdateRefinerPanel?: boolean;

    public catalogId?: number;

    public channelInventoryConfiguration?: ChannelInventoryConfiguration;

    public inventoryRefiner?: IProductRefinerHierarchy;

    public constructor(
        pageType: listPageType,
        apiSettings: ICommerceApiSettings,
        queryResultSettings: IQueryResultSettings,
        refiners: ProductRefinerValue[],
        category: number | undefined,
        searchText: string | undefined,
        includeAttributes: boolean | undefined,
        isUpdateRefinerPanel?: boolean | undefined,
        locale?: string,
        catalogId?: number,
        channelInventoryConfiguration?: ChannelInventoryConfiguration,
        inventoryRefiner?: IProductRefinerHierarchy
    ) {
        this.pageType = pageType;
        this.apiSettings = apiSettings;
        this.category = category;
        this.searchText = searchText;
        this.queryResultSettings = queryResultSettings;
        this.refiners = refiners;
        this.includeAttributes = includeAttributes;
        this.isUpdateRefinerPanel = isUpdateRefinerPanel;
        this.locale = locale;
        this.catalogId = catalogId ?? 0;
        this.channelInventoryConfiguration = channelInventoryConfiguration;
        this.inventoryRefiner = inventoryRefiner;
    }

    public getCacheKey = () => {
        const queryResultSettings = {
            ...this.queryResultSettings.Paging,
            ...toJS(this.queryResultSettings.Sorting)
        };

        const cacheKey = generateCacheKey(
            this.apiSettings,
            { key: 'PageType', value: this.pageType },
            { key: 'Category', value: this.category },
            { key: 'SearchText', value: this.searchText },
            { key: 'CatalogId', value: this.catalogId },
            {
                key: 'Refiners',
                value: this.refiners.map(
                    refiner =>
                        `RefinerRecordId:${refiner.RefinerRecordId}-LeftValueBoundString:${refiner.LeftValueBoundString ||
                            ''}-RightValueBoundString:${refiner.RightValueBoundString || ''}`
                )
            },
            { key: 'QueryResultSettings', value: convertToString(queryResultSettings) },
            { key: 'Locale', value: this.locale }
        );
        return cacheKey;
    };

    public getCacheObjectType = () => 'CollectionActionResult';

    public dataCacheType = (): CacheType => 'request';
}

// TODO: Create a data model here or import one to capture the response of the action
export interface IGetFullProductsByCollectionData {
    text: string;
}

export type CollectionClassConstructor = new (
    pageType: listPageType,
    apiSettings: ICommerceApiSettings,
    queryResultSettings: IQueryResultSettings,
    refiners: ProductRefinerValue[],
    category: number | undefined,
    searchText: string | undefined,
    includeAttributes: boolean | undefined,
    isUpdateRefinerPanel?: boolean | undefined,
    locale?: string,
    catalogId?: number,
    channelInventoryConfiguration?: ChannelInventoryConfiguration,
    inventoryRefiner?: IProductRefinerHierarchy
) => BaseCollectionInput;

/**
 * TODO: Use this function to create the input required to make the action call.
 * @param args
 * @param inputClassConstuctor
 */
export const createBaseCollectionInput = (
    args: ICreateActionContext,
    inputClassConstuctor: CollectionClassConstructor
): BaseCollectionInput => {
    const pageType =
        args.requestContext.urlTokens.pageType === 'Category' || (args.requestContext.query && args.requestContext.query.categoryId)
            ? 'Category'
            : 'Search';

    const queryResultSettings = QueryResultSettingsProxy.fromInputData(args).QueryResultSettings;
    const queryRefiners = hydrateRefinersFromUrl(args.requestContext);
    const includeAttributes = getIncludeAttributes(args);
    const isUpdateRefinerPanel = getUpdateRefinerPanel(args);
    const catalogId = getCatalogId(args.requestContext);

    if (args.requestContext.query && args.requestContext.query.sorting) {
        queryResultSettings.Sorting = { Columns: <SortColumn[]>JSON.parse(decodeURIComponent(args.requestContext.query.sorting)) };
    }

    if (pageType === 'Category') {
        return new inputClassConstuctor(
            pageType,
            args.requestContext.apiSettings,
            queryResultSettings,
            queryRefiners,
            +(args.requestContext.urlTokens.itemId || (args.requestContext.query && args.requestContext.query.categoryId) || 0),
            undefined,
            includeAttributes,
            isUpdateRefinerPanel,
            args.requestContext.locale,
            catalogId
        );
    } else if (pageType === 'Search' && args.requestContext.query && args.requestContext.query.q) {
        return new inputClassConstuctor(
            pageType,
            args.requestContext.apiSettings,
            queryResultSettings,
            queryRefiners,
            undefined,
            args.requestContext.query.q,
            includeAttributes,
            isUpdateRefinerPanel,
            args.requestContext.locale,
            catalogId
        );
    } else if (pageType === 'Search' && args.requestContext.query && args.requestContext.query.recommendation) {
        let searchText = '';
        if (args.requestContext.query.productId) {
            searchText = JSON.stringify({
                ProductId: args.requestContext.query.productId,
                Recommendation: args.requestContext.query.recommendation
            });
        } else {
            searchText = JSON.stringify({ Recommendation: args.requestContext.query.recommendation });
        }
        return new inputClassConstuctor(
            pageType,
            args.requestContext.apiSettings,
            queryResultSettings,
            queryRefiners,
            undefined,
            searchText,
            includeAttributes,
            isUpdateRefinerPanel,
            args.requestContext.locale,
            catalogId
        );
    } else if (pageType === 'Search' && args.requestContext.query && args.requestContext.query.discountIds) {
        const searchText = JSON.stringify({ DiscountIds: args.requestContext.query.discountIds });
        return new inputClassConstuctor(
            pageType,
            args.requestContext.apiSettings,
            queryResultSettings,
            queryRefiners,
            undefined,
            searchText,
            includeAttributes,
            isUpdateRefinerPanel,
            args.requestContext.locale,
            catalogId
        );
    }

    throw new Error('[getFullProductsForCollection]Unable to create input');
};
