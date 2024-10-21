### Header Module

```jsx noeditor
const Header = require('./header.tsx').default;
const mockData = require('./mocks/header.json');

const alertJSON = require('./mocks/alert.json');
const alertItem = <AlertModule data={alertJSON.data} config={alertJSON.config} />;

const logoJSON = require('../../../../logo/src/modules/logo/mocks/logo.json');
const logoItem = <LogoModule data={logoJSON.data} config={logoJSON.config}  context={logoJSON.context}/>;

const searchJSON = require('./mocks/search.json');
const search = <Search data={searchJSON.data} config={searchJSON.config} />;


const navigationMenuJSON = require('../../../../navigation-menu/src/modules/navigation-menu//mocks/navigation-menu.json');

const categories = Promise.resolve(navigationMenuJSON.categories);
const cmsNavItems = navigationMenuJSON.data.cmsNavItems;
const navigationMenu = <NavigationMenu data={navigationMenuJSON.data} config={navigationMenuJSON.config} resources={navigationMenuJSON.resources}/>;

const signInJSON = require('../../../../account-management/src/modules/signin-info/mocks/signin-info.json');
const SigninInfo = require('../../../../account-management/src/modules/signin-info/signin-info.tsx').default;
const signIn = <SigninInfo data={signInJSON.data} config={signInJSON.config} context={signInJSON.context} resources={signInJSON.resources}/>;

const wishListJSON = require('../../../../wishlist/src/modules/wishlist-icon/mocks/wishlist-icon.json');
const WishlistIcon = require('../../../../wishlist/src/modules/wishlist-icon/wishlist-icon.tsx').default;
const wishList = <WishlistIcon data={wishListJSON.data} config={wishListJSON.config} context={wishListJSON.context} resources={wishListJSON.resources}/>;


const cartJSON = require('../../../../cart/src/modules/cart-icon/mocks/cart-icon.json');
const CartIcon = require('../../../../cart/src/modules/cart-icon/cart-icon.tsx').default;
const carticon = <CartIcon data={cartJSON.data} resources={cartJSON.resources} config={cartJSON.config} context={cartJSON.context}/>;

<Header
    data={mockData.data}
    config={mockData.config}
    resources={mockData.resources}
    slots={{
        alertMessages: [alertItem],
        logo: [logoItem],
        menuBar: [navigationMenu],
        search: [search],
        signin: [signIn],
        wishlist: [wishList],
        cart: [carticon]
    }}
/>;
```
