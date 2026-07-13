import { Link } from 'react-router';
import { Twitter, Github, Linkedin, Mail, Globe } from 'lucide-react';
import { FooterBackgroundGradient, TextHoverEffect } from '@/components/ui/hover-footer';

export function LandingFooter() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "AI Chat", href: "/chat" },
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Live Chat", href: "#", pulse: true },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={18} className="text-indigo-500" />,
      text: "hello@m-chat.ai",
      href: "mailto:hello@m-chat.ai",
    },
    {
      icon: <Globe size={18} className="text-indigo-500" />,
      text: "San Francisco, CA",
    },
  ];

  const socialLinks = [
    { icon: <Twitter size={20} />, label: "Twitter", href: "#" },
    { icon: <Github size={20} />, label: "GitHub", href: "#" },
    { icon: <Linkedin size={20} />, label: "LinkedIn", href: "#" },
  ];

  return (
    <footer className="bg-card relative h-fit rounded-t-3xl overflow-hidden mt-8 border-t border-border">
      <div className="max-w-7xl mx-auto p-14 pb-4 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 md:gap-8 lg:gap-12 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4 lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logonobg.png" alt="M-Chat Logo" className="w-8 h-8" />
              <span className="text-foreground text-2xl font-bold">M-Chat</span>
            </Link>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Think Faster. Create Smarter. Your AI workspace for everything.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-sm font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative w-fit">
                    <a
                      href={link.href}
                      className="text-[13px] text-muted-foreground hover:text-indigo-500 transition-colors"
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="absolute top-0 -right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-foreground text-sm font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-[13px] text-muted-foreground">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-indigo-500 transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="hover:text-indigo-500 transition-colors">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-border my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[12px] space-y-4 md:space-y-0 text-muted-foreground">
          {/* Social icons */}
          <div className="flex space-x-6">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-indigo-500 transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="flex flex-col md:items-end gap-1">
            <p className="text-center md:text-left">
              &copy; {new Date().getFullYear()} M-Chat. All rights reserved.
            </p>
            <p className="text-center md:text-right text-[10px]">
              Built with Qwen AI
            </p>
          </div>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[22rem] -mt-20 -mb-28 pointer-events-none">
        <TextHoverEffect text="M-Chat" className="pointer-events-auto" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
