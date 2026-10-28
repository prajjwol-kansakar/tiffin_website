export function createOrderPayload(form, cartItems) {
  const today = new Date();
  const orderDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const notes = [
    `Customer: ${form.name.trim()}`,
    `Phone: ${form.phone.trim()}`,
    `Delivery address: ${form.address.trim()}`,
    form.deliveryDate ? `Delivery date: ${form.deliveryDate}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const orderItems = cartItems.map(({ item, qty }, index) => {
    const grossTotal = qty * item.price;

    return {
      branch: "B1",
      scode: String(item.id),
      rate: item.price,
      quantity: qty,
      gross_total: grossTotal,
      discount: 0,
      tax: 0,
      net_total: grossTotal,
      prate: item.price,
      product_name: item.name,
      unit: item.base_unit,
      sno: index + 1,
      warehouse: item.warehouse || "W-1",
    };
  });
  const totals = orderItems.reduce(
    (summary, item) => ({
      gross_total: summary.gross_total + item.gross_total,
      discount: summary.discount + item.discount,
      tax: summary.tax + item.tax,
      net_total: summary.net_total + item.net_total,
    }),
    { gross_total: 0, discount: 0, tax: 0, net_total: 0 }
  );

  return {
    billno: null,
    branch: "B1",
    entry_date: orderDate,
    ad_date: orderDate,
    ...totals,
    cust_code: null,
    vend_code: null,
    yearid: "26/27",
    tender: 0,
    change: 0,
    trnmode: "SORDER",
    notes,
    refno: null,
    SalesOrderProd: orderItems,
    createdDate: null,
    updatedDate: null,
  };
}
