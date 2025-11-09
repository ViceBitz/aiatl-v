import { FaGithub, FaYoutube } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="text-gray-400 border-t border-gray-800 absolute z-10 w-full">
      <div className="mx-auto max-w-7xl px-2 py-16 sm:px-4 lg:px-6 grid grid-cols-1 md:grid-cols-6 gap-10">
        <div className="md:col-span-2">
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            alt="Logo"
            className="h-8 w-auto mb-4"
          />
          <p className="text-sm mb-6">
            Assisting the world of vibecoding.
          </p>
          <div className="flex space-x-4">
            <a href="https://github.com/TheWalkingSea/aiatl" aria-label="GitHub" className="hover:text-white">
              <FaGithub className="h-5 w-5" />
            </a>
            <a href="https://youtube.com" aria-label="YouTube" className="hover:text-white">
              <FaYoutube className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Solutions</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Marketing</a></li>
            <li><a href="#" className="hover:text-white">Analytics</a></li>
            <li><a href="#" className="hover:text-white">Automation</a></li>
            <li><a href="#" className="hover:text-white">Commerce</a></li>
            <li><a href="#" className="hover:text-white">Insights</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Submit ticket</a></li>
            <li><a href="#" className="hover:text-white">Documentation</a></li>
            <li><a href="#" className="hover:text-white">Guides</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Jobs</a></li>
            <li><a href="#" className="hover:text-white">Press</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Terms of service</a></li>
            <li><a href="#" className="hover:text-white">Privacy policy</a></li>
            <li><a href="#" className="hover:text-white">License</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 py-6 text-center text-sm text-gray-500">
        © 2025 VibeEngine. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
