const express = require('express')
const router = express.Router()
const Razorpay = require('razorpay')
const crypto = require('crypto')
const supabase = require('../lib/supabase')

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, userId, items, address } = req.body
    if (!amount || !userId) {
      return res.status(400).json({ message: 'Amount and userId are required' })
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { 
        userId: userId.toString(),
        items: JSON.stringify(items.map(i => i.id)),
      },
    }

    const order = await razorpay.orders.create(options)

    // Store pending order in DB
    const { error } = await supabase.from('orders').insert({
      user_id: userId,
      total_amount: amount,
      status: 'pending',
      payment_method: 'razorpay',
      payment_status: 'pending',
      razorpay_order_id: order.id,
      delivery_address: address, // Store address from frontend
    })
    if (error) console.error('DB error storing pending order:', error)

    res.json(order)
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ message: 'Failed to create payment order' })
  }
})

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, items, address } = req.body

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    // Update order in DB
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single()

    if (orderErr) throw orderErr

    // Insert order items
    if (items?.length > 0) {
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        seller_id: item.seller_id,
        quantity: item.quantity,
        price_at_time: item.price,
      }))
      await supabase.from('order_items').insert(orderItems)

      // 1. Decrement stock for each product
      // 2. Add money to seller's wallet
      for (const item of items) {
        try {
          // Update stock
          const { data: prod } = await supabase
            .from('products')
            .select('quantity, seller_id, price')
            .eq('id', item.id)
            .single()
          
          if (prod) {
            // Decrement stock
            await supabase
              .from('products')
              .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
              .eq('id', item.id)

            // Add earnings to seller's wallet
            const earnings = prod.price * item.quantity
            const { error: walletErr } = await supabase.rpc('add_wallet_balance', { 
              p_user_id: prod.seller_id, 
              p_amount: earnings 
            })
            if (walletErr) console.error('Error crediting seller wallet:', walletErr)
          }
        } catch (stockErr) {
          console.error('Post-payment processing failed for', item.id, stockErr)
        }
      }
    }

    res.json({ success: true, orderId: orderData.id })
  } catch (err) {
    console.error('Verify payment error:', err)
    res.status(500).json({ message: 'Payment verification failed' })
  }
})

module.exports = router
