import LoginSec from '@/components/loginsection';
const HeroSection = () => {
  return (
    <section
      className='min-h-screen relative flex items-center justify-center bg-gradient-background'
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)),`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-[hsl(210,100%,50%,0.5)] rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(45,93%,47%,0.6)] rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-electric-blue/20 rounded-full blur-2xl animate-ping'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full'>
        <div className='grid md:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]'>
          <div className='space-y-8'>
            <div className='space-y-6'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight'>
                <span className='block text-[hsl(220,15%,95%)]'>
                  Welcome to
                </span>
                <span className='block bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg'>
                  XenCRM
                </span>
              </h1>
              <p className='text-lg sm:text-xl lg:text-2xl text-[hsl(220,10%,60%)] leading-relaxed'>
                Fast, AI powered and Highly Customisable
              </p>
            </div>

            <div className='flex flex-wrap gap-4'>
              <div className='flex items-center space-x-2 text-[hsl(210,100%,50%)]'>
                <div className='w-2 h-2 bg-[hsl(210,100%,50%)] rounded-full animate-pulse'></div>
                <span className='text-sm font-medium'>Secure</span>
              </div>
              <div className='flex items-center space-x-2 text-[hsl(45,93%,47%)]'>
                <div className='w-2 h-2 bg-[hsl(45,93%,47%)] rounded-full animate-pulse delay-300'></div>
                <span className='text-sm font-medium'>Fast</span>
              </div>
              <div className='flex items-center space-x-2 text-[hsl(210,100%,50%)]'>
                <div className='w-2 h-2 bg-[hsl(210,100%,50%)] rounded-full animate-pulse delay-700'></div>
                <span className='text-sm font-medium'>Innovative</span>
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className='flex justify-center'>
            <LoginSec />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
