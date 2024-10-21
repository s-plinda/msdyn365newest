### Checkout Module

```jsx noeditor
const Checkout = require('./checkout.tsx').default;
const mockData = require('./mocks/checkout.json');
const checkoutLineItemsJSON = require('./../checkout-line-items/mocks/checkout-line-items-mock.json');
const CheckoutLineItems = require('./../checkout-line-items/checkout-line-items.tsx').default;

const checkoutItemsModule = <CheckoutLineItems data={checkoutLineItemsJSON.data} config ={checkoutLineItemsJSON.config} context={checkoutLineItemsJSON.context}/>;

const checkoutGuestProfileJSON = require('./../checkout-guest-profile/mocks/checkout-guest-profile.json');
const CheckoutGuestProfile = require('./../checkout-guest-profile/checkout-guest-profile.tsx').default;
const checkoutGuestProfileModule = <CheckoutGuestProfile data={checkoutGuestProfileJSON.data} config ={checkoutGuestProfileJSON.config} context={checkoutGuestProfileModule.context} />;

<Checkout
     data={mockData.data}
     config={mockData.config}
     context={mockData.context} 
     slots={{checkoutInformation: [checkoutItemsModule,checkoutGuestProfileModule]}}
     />
```