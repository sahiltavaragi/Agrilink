import { Link } from 'react-router-dom'
import { Sprout, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Marketplace: [
    { label: 'All Products', to: '/products' },
    { label: 'Organic Fertilizers', to: '/products?category=Organic+Fertilizers' },
    { label: 'Poultry Farming', to: '/products?category=Poultry+Farming' },
    { label: 'Fish Farming', to: '/products?category=Fish+Farming' },
    { label: 'Indoor Farming', to: '/products?category=Indoor+Farming' },
  ],
  Community: [
    { label: 'Feed', to: '/community' },
    { label: 'Farmers Forum', to: '/community' },
    { label: 'Join Community', to: '/register' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Become a Seller', to: '/profile' },
    { label: 'Help Center', to: '/support' },
    { label: 'Privacy Policy', to: '/privacy' },
  ],
}

const socials = [
  { Icon: Facebook, href: '#' },
  { Icon: Twitter, href: '#' },
  { Icon: Instagram, href: '#' },
  { Icon: Youtube, href: '#' },
]

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow-green">
                <Sprout size={22} className="text-white" />
              </div>
              <span className="font-display font-bold text-2xl text-white">
                Agri<span className="text-gradient">Link</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Your trusted marketplace for organic farming inputs. Connecting farmers across India to build a sustainable agricultural ecosystem.
            </p>
            <div className="flex gap-3 mt-6">
              {socials.map(({ Icon, href }, idx) => (
                <a key={idx} href={href}
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-gray-500 hover:text-primary-400 hover:border-primary-600/40 hover:bg-primary-900/20 transition-all duration-200">
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Mail size={14} /> <span>support@agrilink.in</span></div>
              <div className="flex items-center gap-2"><Phone size={14} /> <span>+91 98765 43210</span></div>
              <div className="flex items-center gap-2"><MapPin size={14} /> <span>Bengaluru, Karnataka, India</span></div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-white mb-4 text-sm tracking-wide">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-gray-500 hover:text-primary-400 transition-colors duration-150">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} AgriLink. All rights reserved.</p>
          <p>Made with 🌱 for Indian Farmers</p>
        </div>
      </div>
    </footer>
  )
}
