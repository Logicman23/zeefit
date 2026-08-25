import CartPage from "../cart/page";

/**
 * Parity note: on the original site checkout.php returns byte-identical markup to
 * cart.php while the cart is empty. Same behaviour preserved here.
 */
export const metadata = { title: "Cart" };

export default CartPage;
