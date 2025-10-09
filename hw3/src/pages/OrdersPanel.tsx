import { useOrders } from "@/contexts/OrderContext";
import { Button } from "@/components/ui/button";
import { RequestChangeDialog } from "@/components/RequestChangeDialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Package, MessageSquare, ArrowLeft, Plus } from "lucide-react";

export default function OrdersPanel() {
  const { orders, markChangeRequested } = useOrders();
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleRequestChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    setChangeDialogOpen(true);
  };

  const handleConfirmChange = (reason: string) => {
    markChangeRequested(selectedOrderId, reason);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header with back button and title */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" className="bg-[color:var(--glass)]/60 hover:bg-[color:var(--glass)] border border-white/8 rounded-2xl">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Link>
        </Button>
        <h1 className="font-display text-3xl">Orders</h1>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 text-[color:var(--muted)]" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-[color:var(--muted)] mb-6">Start building your dessert plan today!</p>
          <Button asChild className="bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl">
            <Link to="/">Browse Desserts</Link>
          </Button>
        </div>
      ) : (
        <div>
          {/* Continue shopping button */}
          <div className="mb-6 flex justify-center">
            <Button asChild className="bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl px-6 py-3">
              <Link to="/" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Continue Adding Items
              </Link>
            </Button>
          </div>
          
          <div className="space-y-6">
            {sortedOrders.map((order) => (
            <div key={order.id} className="glass p-6 rounded-2xl">
              {/* Header with status and date */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[color:var(--muted)]" />
                  <span className="text-sm text-[color:var(--muted)]">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === "submitted" 
                    ? "bg-[color:var(--matcha)]/20 text-[color:var(--matcha)]" 
                    : "bg-[color:var(--rose)]/20 text-[color:var(--rose)]"
                }`}>
                  {order.status === "submitted" ? "Submitted" : "Change Requested"}
                </div>
              </div>

              {/* Order summary */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Items */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-xl" 
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-[color:var(--muted)]">
                            ${item.price} × {item.qty}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order details */}
                <div className="space-y-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[color:var(--text)]">
                      ${order.total.toFixed(0)}
                    </div>
                    <div className="text-sm text-[color:var(--muted)]">Total</div>
                  </div>

                  {order.note && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-[color:var(--muted)] mt-0.5" />
                      <div>
                        <div className="text-sm font-medium mb-1">Note</div>
                        <div className="text-sm text-[color:var(--muted)]">{order.note}</div>
                      </div>
                    </div>
                  )}

                  {order.meta?.changeReason && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-[color:var(--rose)] mt-0.5" />
                      <div>
                        <div className="text-sm font-medium mb-1 text-[color:var(--rose)]">Change Request</div>
                        <div className="text-sm text-[color:var(--muted)]">{order.meta.changeReason}</div>
                      </div>
                    </div>
                  )}

                  {order.status === "submitted" && (
                    <Button
                      variant="ghost"
                      onClick={() => handleRequestChange(order.id)}
                      className="w-full bg-[color:var(--glass)]/60 hover:bg-[color:var(--glass)] border border-white/8 rounded-2xl text-[color:var(--rose)] hover:text-[color:var(--rose)]"
                    >
                      Request Change
                    </Button>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      <RequestChangeDialog
        open={changeDialogOpen}
        onOpenChange={setChangeDialogOpen}
        onConfirm={handleConfirmChange}
        orderId={selectedOrderId}
      />
    </div>
  );
}


