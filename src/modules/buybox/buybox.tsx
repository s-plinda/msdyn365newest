/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { getCatalogId, ICoreContext, msdyn365Commerce } from '@msdyn365-commerce/core-internal';
import {
    CommerceProperty,
    ProductCatalog,
    ProductDeliveryOptions,
    ProductDimensionValue,
    ProductDimensionValueInventoryAvailability,
    ProductPrice,
    ReleasedProductType,
    SimpleProduct
} from '@msdyn365-commerce/retail-proxy';
import { BulkPurchase } from '@msdyn365-commerce-modules/bulk-purchase';
import {
    ArrayExtensions,
    DeliveryMode,
    FinitePromiseQueue,
    FinitePromiseQueueError,
    getDeliveryOptionsForSelectedVariant,
    GetDeliveryOptionsForSelectedVariantInput,
    getDimensionsForSelectedVariant,
    GetDimensionsForSelectedVariantInput,
    getDimensionValuesFromQuery,
    getInventoryLevelCodeFromDimensionValue,
    getPriceForSelectedVariant,
    getProductAvailabilitiesForSelectedVariant,
    getSelectedVariant,
    IDimensionsApp,
    IDimensionValueForSelectedVariant,
    InventoryLevelValues,
    IProductInventoryInformation,
    IPromiseQueue,
    PriceForSelectedVariantInput,
    ProductAvailabilitiesForSelectedVariantInput,
    SelectedVariantInput,
    setDimensionValuesToQuery,
    validateCatalogId
} from '@msdyn365-commerce-modules/retail-actions';
import {
    Button,
    getTelemetryObject,
    IModuleProps,
    INodeProps,
    ITelemetryContent,
    updateMaxQuantityForCartLineItem
} from '@msdyn365-commerce-modules/utilities';
import classnames from 'classnames';
import * as React from 'react';

import {
    getBuyboxAddToCart,
    getBuyBoxInventoryLabel,
    getBuyboxKeyInPrice,
    getBuyboxProductAddToOrderTemplate,
    getBuyboxProductAddToWishlist,
    getBuyboxProductComparisonButton,
    getBuyboxProductDescription,
    getBuyboxProductPrice,
    getBuyboxProductQuantity,
    getBuyboxProductRating,
    getBuyboxProductTitle,
    getBuyboxProductUnitOfMeasure,
    getBuyboxShopSimilarButton,
    getQuantityLimitsMessages,
    RetailDefaultOrderQuantityLimitsFeatureName,
    EcommerceQuantityLimitConfigurationsFeatureName,
    RevertToSiteBuilderOrderQuantityLimitsSettingsCRTFeatureName
} from '@msdyn365-commerce-modules/buybox';
import { getBuyboxProductConfigure } from '@msdyn365-commerce-modules/buybox';
import {
    IBuyboxAddToCartViewProps,
    IBuyboxAddToOrderTemplateViewProps,
    IBuyboxAddToWishlistViewProps,
    IBuyboxCallbacks,
    IBuyboxCommonData,
    IBuyboxExtentedProps,
    IBuyboxKeyInPriceViewProps,
    IBuyboxProductConfigureViewProps,
    IBuyboxProductQuantityViewProps,
    IBuyboxShopSimilarLookViewProps,
    IBuyboxState,
    IErrorState,
    ShopSimiliarButtonType
} from '@msdyn365-commerce-modules/buybox';
import { IBuyboxData } from './buybox.data';
import { IBuyboxProps, IBuyboxResources } from './buybox.props.autogenerated';
import { getBuyboxFindInStore, IBuyboxFindInStoreViewProps } from './components/buybox-find-in-store';
import { RecentlyViewedState } from '@msdyn365-commerce-modules/buybox';

export interface IBuyboxViewProps extends IBuyboxProps<IBuyboxData> {
    state: IBuyboxState;
    ModuleProps: IModuleProps;
    ProductInfoContainerProps: INodeProps;
    MediaGalleryContainerProps: INodeProps;
    callbacks: IBuyboxCallbacks;
    mediaGallery?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    rating?: React.ReactNode;
    price?: React.ReactNode;
    productComparisonButton?: React.ReactNode;
    bulkPurchaseLink?: React.ReactNode;
    addToOrderTemplate?: IBuyboxAddToOrderTemplateViewProps;
    addToWishlist?: IBuyboxAddToWishlistViewProps;
    min?: number | undefined;
    max: number | undefined;
    addToCart: IBuyboxAddToCartViewProps;
    findInStore?: IBuyboxFindInStoreViewProps;
    quantity?: IBuyboxProductQuantityViewProps;
    configure?: IBuyboxProductConfigureViewProps;
    inventoryLabel?: React.ReactNode;
    shopSimilarLook?: IBuyboxShopSimilarLookViewProps;
    shopSimilarDescription?: IBuyboxShopSimilarLookViewProps;
    quantityLimitsMessages: React.ReactNode;
    telemetryContent?: ITelemetryContent;
    keyInPrice?: IBuyboxKeyInPriceViewProps;
    unitOfMeasure?: React.ReactNode;
    catalogs?: ProductCatalog[] | undefined;
    isChannelMultipleCatalogsFeatureEnabled?: boolean;
    currentCatalogId?: number;
    applyDefaultOrderSettings?: boolean;
}

/**
 * Buybox Module.
 */
class Buybox extends React.PureComponent<IBuyboxProps<IBuyboxData>, IBuyboxState> {
    /**
     * A queue of tasks of processing the changes in the dimensions.
     * Limit to two processes:
     * 1 - for the current process, which is under execution at the moment.
     * 2 - next process, which will process the latest version of data.
     * @remark Enqueueing new promises will discard the previous ones (except the one which is under processing).
     */
    private readonly dimensionUpdateQueue: IPromiseQueue<void> = new FinitePromiseQueue<void>(2);

    private dimensions: { [id: number]: string } = {};
    private initializedDimensions: Set<string> = new Set();

    private readonly buyboxCallbacks: IBuyboxCallbacks = {
        updateQuantity: (newQuantity: number): boolean => {
            const errorState = { ...this.state.errorState };
            errorState.quantityError = undefined;
            errorState.otherError = undefined;

            this.setState({ quantity: newQuantity, errorState });
            return true;
        },
        updateErrorState: (newErrorState: IErrorState): void => {
            this.setState({ errorState: newErrorState });
        },
        updateSelectedProduct: (
            newSelectedProduct: Promise<SimpleProduct | null>,
            newInventory: IProductInventoryInformation | undefined,
            newPrice: ProductPrice | undefined,
            newDeliveryOptions: ProductDeliveryOptions | undefined
        ): void => {
            this.setState({
                selectedProduct: newSelectedProduct,
                productAvailableQuantity: newInventory,
                productDeliveryOptions: newDeliveryOptions
            });
            this._updatePrice(newPrice);
        },
        initializeDimension: (initializedDimension: string): void => {
            if (initializedDimension) {
                this.initializedDimensions.add(initializedDimension);
            }
        },
        dimensionSelectedAsync: async (selectedDimensionId: number, selectedDimensionValueId: string): Promise<void> => {
            this.dimensions[selectedDimensionId] = selectedDimensionValueId;
            // Only trigger _updateDimensions when all dimensions are initialized
            if (this.initializedDimensions.size === (this.props.data.product.result?.Dimensions?.length || 0)) {
                return this.dimensionUpdateQueue
                    .enqueue(async () => {
                        return this._updateDimensions();
                    })
                    .catch((error: unknown) => {
                        // Ignore discarded processes.
                        if (error !== FinitePromiseQueueError.ProcessWasDiscardedFromTheQueue) {
                            throw error;
                        }
                    });
            }
        },
        getDropdownName: (dimensionType: number, resources: IBuyboxResources): string => {
            return this._getDropdownName(dimensionType, resources);
        },
        changeModalOpen: (isModalOpen: boolean): void => {
            this.setState({ modalOpen: isModalOpen });
        },
        changeUpdatingDimension: (isUpdatingDimension: boolean): void => {
            this.setState({ isUpdatingDimension });
        },

        /**
         * Update isUpdatingDeliveryOptions state.
         *
         * @param isUpdatingDeliveryOptions - The status of updating delivery options.
         */
        changeUpdatingDeliveryOptions: (isUpdatingDeliveryOptions: boolean): void => {
            this.setState({ isUpdatingDeliveryOptions });
        },

        updateKeyInPrice: (customPrice: number): void => {
            // Remove custom amount error when updating the custom price
            const errorState = { ...this.state.errorState };
            errorState.customAmountError = undefined;

            this.setState({ isPriceKeyedIn: true, keyInPriceAmount: customPrice, errorState });
            this._updatePrice(this.state.productPrice, customPrice);
        }
    };

    private readonly telemetryContent: ITelemetryContent;

    public constructor(props: IBuyboxProps<IBuyboxData>, state: IBuyboxState) {
        super(props);
        this.state = {
            errorState: {
                configureErrors: {}
            },
            quantity: 1,
            min: undefined,
            max: undefined,
            selectedProduct: undefined,
            productPrice: undefined,
            productDeliveryOptions: undefined,

            modalOpen: false,
            isUpdatingDimension: false,
            isUpdatingDeliveryOptions: false,
            isPriceApiCalled: false
        };
        this.telemetryContent = getTelemetryObject(props.context.request.telemetryPageName!, props.friendlyName, props.telemetry);
    }

    public async componentDidMount(): Promise<void> {
        const {
            data: {
                product: { result: product },
                productPrice
            },
            context
        } = this.props;

        // There are multiple sources triggering the callback function dimensionSelectedAsync calling the GetActivePrice api before componentDidMount and after componentDidMount.
        // Set isPriceApiCalled to false here to prevent redundant API call after componentDidMount:
        // If the price has not been hydrated before, this means the component was just loaded for the first time with variant selected.
        // We will skip calling RS API in this case as the price data has already been fetched via module data action in node server.

        const matchedDimensions = getDimensionValuesFromQuery(this.props.context.request.url.requestUrl);

        // Set isPriceApiCalled to false only when variant is there
        if (matchedDimensions.length > 0) {
            this.setState({ isPriceApiCalled: false });
        } else {
            this.setState({ isPriceApiCalled: true });
        }

        productPrice.then(async result => {
            this._updatePrice(result);
        });

        if (product) {
            // Check if the product is service or not by product type
            if (product.ItemTypeValue === ReleasedProductType.Service) {
                this.setState({ isServiceItem: true });
            }
            await this._updateQuantitiesInState(product);
        }

        if (product && context.app.config.maxRecentlyViewedItemsCount > 0) {
            RecentlyViewedState.instance(this.props.context, context.app.config.maxRecentlyViewedItemsCount, product.RecordId);
        }
    }

    public render(): JSX.Element | null {
        const {
            slots: { mediaGallery, productComparisonButton },
            data: {
                product: { result: product }
            },
            config: { className = '' }
        } = this.props;

        const { min, max } = this.state;

        if (!product) {
            this.props.context.telemetry.error('Product content is empty, module wont render');
            return null;
        }

        const props = this.props as IBuyboxExtentedProps<IBuyboxCommonData>;
        const defaultMinimumKeyInPrice = 10;
        const defaultMaximumKeyInPrice = 100;

        const context = this.props.context as ICoreContext<IDimensionsApp>;
        const inventoryLevel = context.app.config.inventoryLevel;
        const dimensionValuesWithInventory = ArrayExtensions.flatten(
            ArrayExtensions.validValues(this.props.data.productDimensions.result?.map(value => value.dimensionValuesWithInventory))
        );
        const applyDefaultOrderSettings =
            (this.props.data.featureState?.result?.find(featureState => featureState.Name === RetailDefaultOrderQuantityLimitsFeatureName)
                ?.IsEnabled ??
                false) &&
            (this.props.data.cartConfiguration?.result?.ValidateDefaultOrderSettingsPerLine ?? false);
        const hasAvailableProducts =
            !ArrayExtensions.hasElements(dimensionValuesWithInventory) ||
            dimensionValuesWithInventory.some((value: unknown) => {
                const inventoryLevelCode = getInventoryLevelCodeFromDimensionValue(
                    value as ProductDimensionValueInventoryAvailability,
                    inventoryLevel
                );
                return inventoryLevelCode !== InventoryLevelValues.outOfStock;
            });
        const catalogId = getCatalogId(this.props.context.request);
        validateCatalogId(catalogId);

        const viewProps: IBuyboxViewProps = {
            ...(this.props as IBuyboxProps<IBuyboxData>),
            state: this.state,
            mediaGallery: mediaGallery && mediaGallery.length > 0 ? mediaGallery[0] : undefined,
            ModuleProps: {
                moduleProps: this.props,
                className: classnames('ms-buybox', className)
            },
            ProductInfoContainerProps: {
                className: 'ms-buybox__content'
            },
            MediaGalleryContainerProps: {
                className: 'ms-buybox__media-gallery'
            },
            telemetryContent: this.telemetryContent,
            callbacks: this.buyboxCallbacks,
            title: getBuyboxProductTitle(props),
            description: getBuyboxProductDescription(props),
            bulkPurchaseLink: this._renderBuyboxBulkPurchaseLink(),
            unitOfMeasure: getBuyboxProductUnitOfMeasure(props),
            configure: getBuyboxProductConfigure(props, this.state, this.buyboxCallbacks),
            findInStore: getBuyboxFindInStore(this.props, this.state, this.buyboxCallbacks),
            price: getBuyboxProductPrice(props, this.state),
            addToCart: getBuyboxAddToCart(
                props,
                this.state,
                this.buyboxCallbacks,
                defaultMinimumKeyInPrice,
                defaultMaximumKeyInPrice,
                undefined,
                hasAvailableProducts
            ),
            productComparisonButton: ArrayExtensions.hasElements(productComparisonButton)
                ? getBuyboxProductComparisonButton(
                      productComparisonButton[0],
                      product,
                      getCatalogId(this.props.context.request),
                      this.state
                  )
                : undefined,
            addToOrderTemplate: getBuyboxProductAddToOrderTemplate(
                props,
                this.state,
                this.buyboxCallbacks,
                this._isChannelMultipleCatalogsFeatureEnabled(),
                catalogId
            ),
            addToWishlist: getBuyboxProductAddToWishlist(props, this.state, this.buyboxCallbacks),
            rating: !props.context.app.config.hideRating && getBuyboxProductRating(props),
            quantity: product.IsGiftCard ? undefined : getBuyboxProductQuantity(props, this.state, this.buyboxCallbacks),
            inventoryLabel: getBuyBoxInventoryLabel(props),
            shopSimilarLook:
                this.props.config.enableShopSimilarLooks && !product.IsGiftCard
                    ? getBuyboxShopSimilarButton(props, ShopSimiliarButtonType.Looks)
                    : undefined,
            shopSimilarDescription:
                this.props.config.enableShopSimilarDescription && !product.IsGiftCard
                    ? getBuyboxShopSimilarButton(props, ShopSimiliarButtonType.Description)
                    : undefined,
            keyInPrice:
                this.props.config.enableKeyInPrice && this.state.isCustomPriceSelected
                    ? getBuyboxKeyInPrice(props, this.state, this.buyboxCallbacks)
                    : undefined,
            quantityLimitsMessages: getQuantityLimitsMessages(props, this.state),
            min: applyDefaultOrderSettings ? min : 1,
            max,
            applyDefaultOrderSettings: applyDefaultOrderSettings,
            isChannelMultipleCatalogsFeatureEnabled: this._isChannelMultipleCatalogsFeatureEnabled(),
            currentCatalogId: catalogId,
            catalogs: this._validateCatalogDetails(catalogId)
        };

        return this.props.renderView(viewProps) as React.ReactElement;
    }

    /**
     * Handles anchor click event and scrolls to the given bulk purchase module.
     * @param bulkPurchaseModule - Bulk purchase module.
     * @returns Handler.
     */
    private readonly _onBulkPurchaseLinkClick = (bulkPurchaseModule: Element) => () => {
        const boundingRect = bulkPurchaseModule.getBoundingClientRect();
        const scrollX = boundingRect.left + window.pageXOffset;
        const scrollY = boundingRect.top + window.pageYOffset;

        window.scrollTo(scrollX, scrollY);
    };
    private readonly _isChannelMultipleCatalogsFeatureEnabled = (): boolean => {
        let isMultipleCatalogFeatureEnabledInHq = false;
        if (this.props.data.featureState) {
            isMultipleCatalogFeatureEnabledInHq =
                this.props.data.featureState.result?.find(
                    feature => feature.Name === 'Dynamics.AX.Application.ChannelMultipleCatalogsFeature'
                )?.IsEnabled || false;
        }
        return isMultipleCatalogFeatureEnabledInHq;
    };

    private _renderBuyboxBulkPurchaseLink(): React.ReactNode {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Temporary switch for the feature which is under development.
        if (!this.props.context.app.config.isBulkPurchaseEnabled) {
            return null;
        }

        if (!msdyn365Commerce.isBrowser) {
            return null;
        }

        const bulkPurchaseModules = Array.from(document.getElementsByClassName(BulkPurchase.className));

        if (!ArrayExtensions.hasElements(bulkPurchaseModules)) {
            return null;
        }

        return (
            <Button
                className='ms-buybox__bulk-purchase-anchor'
                title={this.props.resources.bulkPurchaseLinkText}
                onClick={this._onBulkPurchaseLinkClick(bulkPurchaseModules[0])}
            >
                {this.props.resources.bulkPurchaseLinkText}
            </Button>
        );
    }

    private _updatePrice(newPrice: ProductPrice | undefined, customPrice: number | undefined = this.state.keyInPriceAmount): void {
        if (this.state.isCustomPriceSelected && newPrice) {
            newPrice.CustomerContextualPrice = customPrice;
        }
        this.setState({ productPrice: newPrice });
    }

    private _getProductVariant(dimensionsToUpdate: { [id: number]: string }) {
        const {
            data: {
                product: { result: product }
            },
            context: {
                actionContext,
                request: {
                    apiSettings: { channelId }
                }
            }
        } = this.props;

        const productDimensions = this.props.data.productDimensions.result!;

        // Step 3, Build the actually selected dimensions, prioritizing the information in state
        // over the information in data
        const mappedDimensions = productDimensions
            .map(dimension => {
                const dimensions = (dimension.dimensionValuesWithInventory ??
                    dimension.DimensionValues ??
                    []) as IDimensionValueForSelectedVariant[];
                return {
                    DimensionTypeValue: dimension.DimensionTypeValue,
                    DimensionValue:
                        dimensions.find(
                            value => value.DimensionValue?.RecordId.toString() === dimensionsToUpdate[dimension.DimensionTypeValue]
                        )?.DimensionValue ?? dimension.DimensionValue,
                    ExtensionProperties: dimension.ExtensionProperties
                };
            })
            .filter(dimension => dimension.DimensionValue);
        setDimensionValuesToQuery(this.props.context.actionContext.requestContext.url.requestUrl, mappedDimensions);

        // Step 4. Use these dimensions hydrate the product. Wrap this in a promise
        // so that places like add to cart can await it
        const selectedProductPromise = getSelectedVariant(
            new SelectedVariantInput(
                product!.MasterProductId ? product!.MasterProductId : product!.RecordId,
                channelId,
                undefined,
                undefined,
                this.props.context.request
            ),
            actionContext
        );
        this.setState({ selectedProduct: selectedProductPromise });

        return { productVariantPromise: selectedProductPromise, mappedDimensions };
    }

    private readonly _updateDimensions = async (): Promise<void> => {
        const product = this.props.data.product.result;

        const productDimensions = this.props.data.productDimensions.result;

        const hasProductDimensions = ArrayExtensions.hasElements(productDimensions);

        if (!product || !hasProductDimensions) {
            return;
        }

        const dimensionsToUpdate: { [id: number]: string } = { ...this.dimensions };

        this.setState({ isUpdatingDimension: true, isUpdatingDeliveryOptions: true });

        // Step 1: Clear error state to display relevant errors
        if (this.state.errorState.otherError || this.state.errorState.quantityError) {
            const clearErrorState = { ...this.state.errorState };
            clearErrorState.otherError = undefined;
            if (this.state.errorState.errorHost === 'ADDTOCART') {
                clearErrorState.quantityError = undefined;
                clearErrorState.errorHost = undefined;
            }
            this.setState({ errorState: clearErrorState });
        }

        // Step 2: Clear any errors indicating the dimension wasn't selected
        for (const key of Object.keys(dimensionsToUpdate)) {
            if (this.state.errorState.configureErrors[key]) {
                this.setState(previousState => {
                    const errorState = previousState.errorState;
                    errorState.configureErrors[key] = undefined;
                    return { errorState };
                });
            }
        }

        const data = this._getProductVariant(dimensionsToUpdate);
        const productVariant: SimpleProduct | null = await data.productVariantPromise;

        if (!productVariant) {
            return;
        }

        const promises: Promise<void>[] = [
            this._getDimensionsForSelectedVariant(productVariant, data.mappedDimensions),
            this._hydrateInventoryInfo(productVariant),
            this._hydratePrice(productVariant),
            this._hydrateDeliveryOptions(productVariant),
            this._updateQuantitiesInState(productVariant)
        ];

        await Promise.all(promises);
    };

    private async _getDimensionsForSelectedVariant(
        productVariant: SimpleProduct,
        mappedDimensions: {
            /* eslint-disable @typescript-eslint/naming-convention -- Retail proxy values */
            DimensionTypeValue: number;
            DimensionValue: ProductDimensionValue | undefined;
            ExtensionProperties: CommerceProperty[] | undefined;
            /* eslint-enable @typescript-eslint/naming-convention -- Retail proxy values */
        }[]
    ): Promise<void> {
        await getDimensionsForSelectedVariant(
            new GetDimensionsForSelectedVariantInput(
                productVariant.MasterProductId ? productVariant.MasterProductId : productVariant.RecordId,
                this.props.context.request.apiSettings.channelId,
                mappedDimensions,
                this.props.context.request
            ),
            this.props.context.actionContext
        );
    }

    private async _hydrateInventoryInfo(productVariant: SimpleProduct): Promise<void> {
        // Step 5. Use these dimensions hydrate the inventory. Wrap this in a promise
        // so that places like add to cart can await it
        const newAvailableQuantity = await getProductAvailabilitiesForSelectedVariant(
            new ProductAvailabilitiesForSelectedVariantInput(
                productVariant.RecordId,
                this.props.context.request.apiSettings.channelId,
                productVariant
            ),
            this.props.context.actionContext
        );

        const newShippingQuantity = newAvailableQuantity?.find(
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (shipping: { deliveryType: any }) => shipping.deliveryType === DeliveryMode.shipping
        );
        const isCustomPriceSelected = productVariant.Dimensions?.find(
            dimension =>
                dimension.DimensionTypeValue === 4 && dimension.DimensionValue && dimension.DimensionValue.Value?.toLowerCase() === 'custom'
        );
        if (isCustomPriceSelected) {
            this.setState({ isCustomPriceSelected: true });
        } else {
            this.setState(previousState => {
                const errorState = previousState.errorState;
                errorState.customAmountError = undefined;
                return { isCustomPriceSelected: false, isPriceKeyedIn: false, errorState };
            });
        }

        if (newShippingQuantity) {
            this.setState({ productAvailableQuantity: newShippingQuantity });
        } else {
            this.setState({ productAvailableQuantity: undefined });
        }
    }

    private async _hydratePrice(productVariant: SimpleProduct): Promise<void> {
        // This function is invoked when dimensionSelectedAsync get called.
        // If the price has not been hydrated before, this means the component was just loaded for the first time with variant selected.
        // We will skip calling RS API in this case as the price data has already been fetched via module data action in node server.
        if (!this.state.isPriceApiCalled) {
            this.setState({ isPriceApiCalled: true });
            return;
        }

        // Step 6. Use these dimensions hydrate the product price.
        const newPrice = await getPriceForSelectedVariant(
            new PriceForSelectedVariantInput(productVariant.RecordId, this.props.context.request.apiSettings.channelId, productVariant),
            this.props.context.actionContext
        );

        if (newPrice) {
            this._updatePrice(newPrice);
        }
    }

    private async _hydrateDeliveryOptions(productVariant: SimpleProduct): Promise<void> {
        const retailMultiplePickupFeatureState = this.props.data.featureState.result?.find(
            featureState => featureState.Name === 'Dynamics.AX.Application.RetailMultiplePickupDeliveryModeFeature'
        );

        // Step 7. Use these dimensions hydrate the product delivery options.
        const newDeliveryOptions = await getDeliveryOptionsForSelectedVariant(
            new GetDeliveryOptionsForSelectedVariantInput(
                productVariant.RecordId,
                this.props.context.request.apiSettings.channelId,
                productVariant,
                undefined,
                retailMultiplePickupFeatureState?.IsEnabled
            ),
            this.props.context.actionContext
        );

        if (newDeliveryOptions) {
            this.setState({ productDeliveryOptions: newDeliveryOptions });
        }
    }

    private async _updateQuantitiesInState(product: SimpleProduct): Promise<void> {
        const isOrderQuantityLimitsFeatureEnabled = await this._isOrderQuantityLimitsFeatureEnabled();
        const isChannelLimitsFeatureEnabled = await this._isChannelLimitsFeatureEnabled();

        const min: number = this._getMinQuantityForCartLineItem(isOrderQuantityLimitsFeatureEnabled, product);
        const max: number = this._getMaxQuantityForCartLineItem(
            isChannelLimitsFeatureEnabled || isOrderQuantityLimitsFeatureEnabled,
            product
        );
        let quantity: number = this._getQuantity(product, isOrderQuantityLimitsFeatureEnabled);
        quantity = Math.max(quantity, min);

        this.setState({
            min,
            max,
            quantity
        });
    }

    private _getMinQuantityForCartLineItem(isOrderQuantityLimitsFeatureEnabled: boolean, product: SimpleProduct): number {
        if (
            isOrderQuantityLimitsFeatureEnabled &&
            this._getIgnoreOrderSettings() &&
            product?.Behavior?.MinimumQuantity &&
            product.Behavior.MinimumQuantity > 0
        ) {
            return product.Behavior.MinimumQuantity;
        }

        return 1;
    }

    private _getMaxQuantityForCartLineItem(isQuantityLimitsFeatureEnabled: boolean, product: SimpleProduct): number {
        if (
            isQuantityLimitsFeatureEnabled &&
            this._getIgnoreOrderSettings() &&
            product?.Behavior?.MaximumQuantity &&
            product.Behavior.MaximumQuantity > 0
        ) {
            return product.Behavior.MaximumQuantity;
        }
        return updateMaxQuantityForCartLineItem(this.props.context.app.config.maxQuantityForCartLineItem);
    }

    /**
     * Retrieves the value of the IgnoreOrderSettings property from the cart configuration.
     * If the property is not present, it defaults to false.
     * @returns {boolean} The value of the IgnoreOrderSettings property.
     */
    private _getIgnoreOrderSettings(): boolean {
        const cartConfiguration = this.props.data.cartConfiguration;
        return !(cartConfiguration?.result?.IgnoreOrderSettings ?? false);
    }

    private _getQuantity(product: SimpleProduct, isOrderQuantityLimitsFeatureEnabled: boolean): number {
        const { quantity } = this.state;
        let defaultQuantity = 1;

        if (quantity !== defaultQuantity || !isOrderQuantityLimitsFeatureEnabled) {
            return quantity;
        }

        const cartConfiguration = this.props.data.cartConfiguration;
        const applyDefaultOrderSettingsForCartLine = cartConfiguration?.result?.ValidateDefaultOrderSettingsPerLine ?? false;
        if (!applyDefaultOrderSettingsForCartLine) {
            return quantity;
        }

        if (product?.Behavior?.DefaultQuantity && product.Behavior.DefaultQuantity > 0) {
            defaultQuantity = product.Behavior.DefaultQuantity;
        }

        return defaultQuantity;
    }

    private readonly _getDropdownName = (dimensionType: number, resources: IBuyboxResources): string => {
        const isGiftCard = this.props.data.product.result?.IsGiftCard;

        switch (dimensionType) {
            case 1: // ProductDimensionType.Color
                return resources.productDimensionTypeColor;
            case 2: // ProductDimensionType.Configuration
                return resources.productDimensionTypeConfiguration;
            case 3: // ProductDimensionType.Size
                return resources.productDimensionTypeSize;
            case 4: // ProductDimensionType.Style
                return isGiftCard ? resources.productDimensionTypeAmount : resources.productDimensionTypeStyle;
            default:
                return '';
        }
    };

    private async _isOrderQuantityLimitsFeatureEnabled(): Promise<boolean> {
        const featureStatuses = await this.props.data.featureState;

        const isFeatureEnabledInHq = featureStatuses?.find(
            featureState => featureState.Name === RetailDefaultOrderQuantityLimitsFeatureName
        )?.IsEnabled;
        if (!isFeatureEnabledInHq) {
            return false;
        }
        const useSiteBuilderSettings = featureStatuses?.find(
            featureState => featureState.Name === RevertToSiteBuilderOrderQuantityLimitsSettingsCRTFeatureName
        )?.IsEnabled;

        if (useSiteBuilderSettings) {
            const defaultOrderQuantityLimitsFeatureConfig = this.props.context?.request?.app?.platform?.enableDefaultOrderQuantityLimits;
            if (defaultOrderQuantityLimitsFeatureConfig === 'none') {
                return false;
            }

            if (defaultOrderQuantityLimitsFeatureConfig === 'all') {
                return true;
            }
            let customerInfo;
            try {
                customerInfo = await this.props.data.customerInformation;
            } catch (error) {
                this.props.telemetry.information('dsfsdfs');
                this.props.telemetry.debug('Unable to receive Customer Information. May be user is not authorized');
                return false;
            }

            return (
                customerInfo &&
                ((defaultOrderQuantityLimitsFeatureConfig === 'b2b' && customerInfo.IsB2b) ||
                    (defaultOrderQuantityLimitsFeatureConfig === 'b2c' && !customerInfo.IsB2b))
            );
        } else {
            const cartConfiguration = await this.props.data.cartConfiguration;
            return !(cartConfiguration?.IgnoreOrderSettings ?? false);
        }
    }

    private _validateCatalogDetails(catalogId: number): ProductCatalog[] | undefined {
        const catalogs = this.props.data.catalogs?.result?.filter(item => item.RecordId === catalogId);
        if (ArrayExtensions.hasElements(catalogs) && catalogs[0].RecordId === 0) {
            return;
        }

        return catalogs;
    }

    private async _isChannelLimitsFeatureEnabled(): Promise<boolean> {
        const featureStatuses = await this.props.data.featureState;

        const isChannelLimitsFeatureEnabledInHq = featureStatuses?.find(
            featureState => featureState.Name === EcommerceQuantityLimitConfigurationsFeatureName
        )?.IsEnabled;

        return isChannelLimitsFeatureEnabledInHq ?? false;
    }
}

export default Buybox;
