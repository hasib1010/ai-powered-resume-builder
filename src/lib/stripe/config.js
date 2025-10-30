// lib/stripe/config.js

export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: {
      resumeGenerations: 2,
      savedResumes: 5,
      templates: 'basic',
      exports: ['pdf'],
      support: 'community',
    },
    limits: {
      monthlyGenerations: 2,
      maxSavedResumes: 5,
    }
  },
  PRO: {
    name: 'Pro',
    price: 999, // in cents ($9.99)
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: {
      resumeGenerations: 'unlimited',
      savedResumes: 'unlimited',
      templates: 'all',
      exports: ['pdf', 'docx'],
      support: 'priority',
      customBranding: true,
    },
    limits: {
      monthlyGenerations: -1, // unlimited
      maxSavedResumes: -1, // unlimited
    }
  },
  BUSINESS: {
    name: 'Business',
    price: 2999, // in cents ($29.99)
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    features: {
      resumeGenerations: 'unlimited',
      savedResumes: 'unlimited',
      templates: 'all',
      exports: ['pdf', 'docx'],
      support: 'dedicated',
      customBranding: true,
      teamCollaboration: true,
      bulkGeneration: true,
      apiAccess: true,
    },
    limits: {
      monthlyGenerations: -1,
      maxSavedResumes: -1,
      teamMembers: 10,
    }
  }
}

export const TRIAL_PERIOD_DAYS = 14

// Stripe webhook events to handle
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  PAYMENT_FAILED: 'invoice.payment_failed',
}