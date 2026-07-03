import { PublicLayout } from "../components/layout/PublicLayout";
import { EmptyState } from "../components/common/EmptyState";
import { OrderForm } from "../components/orders/OrderForm";
import { useCart } from "../hooks/useCart";
export function OrderPage({ cartState }: { cartState: ReturnType<typeof useCart> }) { return <PublicLayout><main className="narrow"><h1>Bestellübersicht</h1>{cartState.cart.length === 0 ? <EmptyState title="Dein Warenkorb ist leer" text="Wähle zuerst ein Produkt aus." action={<a className="buttonLink" href="/">Produkte ansehen</a>} /> : <OrderForm cart={cartState.cart} clearCart={() => cartState.setCart([])} />}</main></PublicLayout>; }