// pages/index.js
import Head from 'next/head';
import { LockIcon, ShieldIcon, AnonymousIcon, SendIcon } from '../app/components/Icons';
import MetaMaskConnect from './components/MetaMaskConnect';

export default function WhistleblowerPlatform() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>ReporterX - Secure Whistleblowing Platform</title>
        <link rel="icon" href="/shield.ico" />
      </Head>

      {/* Floating Navigation Bar */}
      <nav className="fixed w-full top-0 z-50 bg-black bg-opacity-70 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldIcon className="w-8 h-8 text-white" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              ReporterX
            </span>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#features" className="hover:text-gray-300 transition-colors">Security</a>
            <a href="#process" className="hover:text-gray-300 transition-colors">How It Works</a>
            
            <button className="ml-4 bg-gradient-to-r from-white to-gray-300 px-6 py-2 rounded-full text-black hover:opacity-90 transition-opacity">
              Report Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <br />
            <br />
            
            <span className="bg-gradient-to-r from-white to-[rgb(228,146,235)] bg-clip-text text-transparent">
              Report Safely,
            </span>
            <br />
            <span className="bg-gradient-to-r from-[rgb(228,146,235)] via-white to-[rgb(228,146,235)] bg-clip-text text-transparent">
              Protect Your Identity
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Secure anonymous reporting to authorities with military-grade encryption and blockchain technology
          </p>
          <div className="flex justify-center space-x-4">
          
            
            <MetaMaskConnect />
              
            
            
          {/**/}





          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 text-center">Your Safety Comes First</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <AnonymousIcon />, title: "Complete Anonymity", text: "Zero personal data collected" },
              { icon: <LockIcon />, title: "End-to-End Encryption", text: "Bank-level security protocols" },
              { icon: <ShieldIcon />, title: "Legal Protection", text: "Whistleblower rights advocacy" },
            ].map((feature, index) => (
              <div key={index} className="p-8 border border-gray-800 rounded-xl hover:border-gray-600 transition-all group">
                <div className="w-12 h-12 mb-6 text-gray-300 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting Process Section */}
      <section id="process" className="py-20 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center">Secure Reporting Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {['Prepare', 'Encrypt', 'Submit', 'Protect'].map((step, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center text-2xl font-bold border border-gray-800">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step}</h3>
                <p className="text-gray-400">Lorem ipsum dolor sit amet consectetur</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900">
        <div className="container mx-auto px-6 py-12">
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>Secure reporting system powered by blockchain technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
