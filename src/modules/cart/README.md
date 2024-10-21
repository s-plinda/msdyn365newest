### Cart Module

```jsx noeditor
const Cart = require('./cart.tsx').default;
const mockData = require('./mocks/cart.json');

const CheckoutJSON = require('./../cart-checkout-button/mocks/cart-checkout-button.json');
const CartCheckoutButton = require('./../cart-checkout-button/cart-checkout-button.tsx').default;
const checkoutButtonOrderSummary = <CartCheckoutButton data={CheckoutJSON.data} resources ={CheckoutJSON.resources} config={CheckoutJSON.config} context={CheckoutJSON.context}/>;

const cartOrderSummyJSON = require('./../cart-order-summary/mocks/cart-order-summary.json');
const CartOrderSummary = require('./../cart-order-summary/cart-order-summary.tsx').default;
const cartordersummary1 = <CartOrderSummary data={cartOrderSummyJSON.data}  resources ={cartOrderSummyJSON.resources}  config ={cartOrderSummyJSON.config} context={cartOrderSummyJSON.context}/>;

const contentRichBlockJSON = require('./mocks/content-rich-block.json');
const contentRichBlock = <ContentRichBlock slots={contentRichBlockJSON.slots} config ={contentRichBlockJSON.config}/>;

const cartLineItemsJSON = require('./../cart-line-items/mocks/cart-line-items-mock.json');
const CartLineItems = require('./../cart-line-items/cart-line-items.tsx').default;

const cartLineItemsModule = <CartLineItems data={cartLineItemsJSON.data} resources ={cartLineItemsJSON.resources} config ={cartLineItemsJSON.config} context={cartLineItemsJSON.context}/>;

<Cart
    data={mockData.data} resources ={mockData.resources}
    config={mockData.config} slots={{lineItems: [cartLineItemsModule],checkoutButtonOrderSummary: [cartordersummary1, checkoutButtonOrderSummary, contentRichBlock]}}/>
```