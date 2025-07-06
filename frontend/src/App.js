import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Sidebar,
  MobileSidebar,
  MobileBottomNav,
  TweetComposer,
  Tweet,
  RightSidebar,
  SearchBar,
  Header,
  Modal
} from './components';

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [tweets, setTweets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Mock data for current user
  const currentUser = {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://images.unsplash.com/photo-1639747279286-c07eecb47a0b?w=100&h=100&fit=crop&crop=face',
    verified: true
  };

  // Mock data for tweets
  const mockTweets = [
    {
      id: 1,
      user: {
        name: 'Tech News',
        username: 'technews',
        avatar: 'https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg?w=100&h=100&fit=crop&crop=face',
        verified: true
      },
      content: 'Breaking: New AI breakthrough achieved in 2025! The future of technology is here and it\'s more exciting than ever. What are your thoughts on the latest developments?',
      time: '2h',
      likes: 1234,
      retweets: 567,
      replies: 89,
      image: null
    },
    {
      id: 2,
      user: {
        name: 'Sarah Johnson',
        username: 'sarahj',
        avatar: 'https://images.unsplash.com/photo-1533636721434-0e2d61030955?w=100&h=100&fit=crop&crop=face',
        verified: false
      },
      content: 'Just finished an amazing coding session! Built a new feature that I\'m really proud of. The satisfaction of solving complex problems never gets old 💻✨',
      time: '4h',
      likes: 256,
      retweets: 45,
      replies: 23,
      image: 'https://images.unsplash.com/photo-1640273561756-13e745747e55?w=500&h=300&fit=crop'
    },
    {
      id: 3,
      user: {
        name: 'Design Studio',
        username: 'designstudio',
        avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=100&h=100&fit=crop&crop=face',
        verified: true
      },
      content: 'UI/UX trends for 2025 are absolutely mind-blowing! 🎨 The intersection of AI and design is creating possibilities we never imagined. What\'s your favorite design trend this year?',
      time: '6h',
      likes: 892,
      retweets: 234,
      replies: 156,
      image: null
    },
    {
      id: 4,
      user: {
        name: 'Alex Chen',
        username: 'alexchen',
        avatar: 'https://images.pexels.com/photos/8726735/pexels-photo-8726735.jpeg?w=100&h=100&fit=crop&crop=face',
        verified: false
      },
      content: 'Working on some exciting VR projects lately. The immersive experiences we can create now are incredible. Virtual reality is truly transforming how we interact with digital content.',
      time: '8h',
      likes: 445,
      retweets: 78,
      replies: 34,
      image: 'https://images.pexels.com/photos/8728559/pexels-photo-8728559.jpeg?w=500&h=300&fit=crop'
    },
    {
      id: 5,
      user: {
        name: 'StartupLife',
        username: 'startuplife',
        avatar: 'https://images.unsplash.com/photo-1590030535521-e69873a44ee0?w=100&h=100&fit=crop&crop=face',
        verified: true
      },
      content: 'Remember: Every expert was once a beginner. Every pro was once an amateur. Every icon was once an unknown. Don\'t be afraid to start your journey! 🚀',
      time: '12h',
      likes: 2156,
      retweets: 987,
      replies: 234,
      image: null
    }
  ];

  // Mock data for trending topics
  const trendingTopics = [
    {
      category: 'Technology',
      title: 'AI in 2025',
      posts: '125K'
    },
    {
      category: 'Programming',
      title: 'React 19',
      posts: '89K'
    },
    {
      category: 'Design',
      title: 'UI Trends',
      posts: '67K'
    },
    {
      category: 'Startups',
      title: 'Tech Funding',
      posts: '45K'
    }
  ];

  // Mock data for follow suggestions
  const followSuggestions = [
    {
      name: 'Emma Watson',
      username: 'emmawatson',
      avatar: 'https://images.unsplash.com/photo-1639747279286-c07eecb47a0b?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Code Master',
      username: 'codemaster',
      avatar: 'https://images.pexels.com/photos/7616608/pexels-photo-7616608.jpeg?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Design Guru',
      username: 'designguru',
      avatar: 'https://images.unsplash.com/photo-1533636721434-0e2d61030955?w=100&h=100&fit=crop&crop=face'
    }
  ];

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  // Save theme to localStorage and update body class
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
  }, [isDark]);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setTweets(mockTweets);
  }, []);

  const handleTweet = (content) => {
    const newTweet = {
      id: tweets.length + 1,
      user: currentUser,
      content,
      time: 'now',
      likes: 0,
      retweets: 0,
      replies: 0,
      image: null
    };
    setTweets([newTweet, ...tweets]);
    setShowModal(false);
  };

  const handleLike = (tweetId, isLiked) => {
    setTweets(tweets.map(tweet => 
      tweet.id === tweetId 
        ? { ...tweet, likes: isLiked ? tweet.likes + 1 : tweet.likes - 1 }
        : tweet
    ));
  };

  const handleRetweet = (tweetId, isRetweeted) => {
    setTweets(tweets.map(tweet => 
      tweet.id === tweetId 
        ? { ...tweet, retweets: isRetweeted ? tweet.retweets + 1 : tweet.retweets - 1 }
        : tweet
    ));
  };

  const handleReply = (tweetId) => {
    console.log('Reply to tweet:', tweetId);
  };

  const handleSearch = (searchTerm) => {
    console.log('Search for:', searchTerm);
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleMenuClick = () => {
    setShowMobileSidebar(true);
  };

  const handleCompose = () => {
    setShowModal(true);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Home" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            {!isMobile && (
              <TweetComposer 
                currentUser={currentUser} 
                onTweet={handleTweet} 
                isDark={isDark}
              />
            )}
            <div className="divide-y divide-gray-800">
              {tweets.map(tweet => (
                <Tweet
                  key={tweet.id}
                  tweet={tweet}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                  onReply={handleReply}
                  isMobile={isMobile}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        );
      case 'explore':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <SearchBar 
              onSearch={handleSearch} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <Header 
              title="Explore" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-xl' : 'text-2xl'} ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Trending now
              </h2>
              <div className="space-y-4">
                {trendingTopics.map((trend, index) => (
                  <div key={index} className={`${isMobile ? 'p-3' : 'p-4'} border rounded-lg cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-gray-800 hover:bg-gray-900' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {trend.category}
                    </p>
                    <h3 className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {trend.title}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {trend.posts} posts
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Notifications" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                No new notifications
              </p>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Messages" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                No messages yet
              </p>
            </div>
          </div>
        );
      case 'bookmarks':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Bookmarks" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                No bookmarks yet
              </p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Profile" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full`}
                />
                <div>
                  <h2 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'} ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentUser.name}
                  </h2>
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    @{currentUser.username}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    123
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Following
                  </p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    456
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Followers
                  </p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    789
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Posts
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen pb-20 lg:pb-0">
            <Header 
              title="Home" 
              onMenuClick={handleMenuClick} 
              isMobile={isMobile}
              isDark={isDark}
            />
            <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                Coming soon...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="max-w-6xl mx-auto flex">
          {/* Desktop Sidebar */}
          <Sidebar 
            currentUser={currentUser} 
            onNavigate={handleNavigation}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
          />
          
          {/* Mobile Sidebar */}
          <MobileSidebar 
            isOpen={showMobileSidebar}
            onClose={() => setShowMobileSidebar(false)}
            currentUser={currentUser}
            onNavigate={handleNavigation}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
          />
          
          {/* Main Content */}
          <main className={`flex-1 ${isMobile ? 'w-full' : 'lg:ml-64 xl:mr-80'} ${
            !isMobile ? (isDark ? 'border-x border-gray-800' : 'border-x border-gray-200') : ''
          }`}>
            <Routes>
              <Route path="/" element={renderMainContent()} />
              <Route path="/explore" element={renderMainContent()} />
              <Route path="/notifications" element={renderMainContent()} />
              <Route path="/messages" element={renderMainContent()} />
              <Route path="/bookmarks" element={renderMainContent()} />
              <Route path="/profile" element={renderMainContent()} />
            </Routes>
          </main>
          
          {/* Desktop Right Sidebar */}
          <aside className="fixed right-0 top-0 h-screen overflow-y-auto">
            <RightSidebar 
              trends={trendingTopics}
              suggestions={followSuggestions}
              isDark={isDark}
            />
          </aside>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          currentView={currentView}
          onNavigate={handleNavigation}
          onCompose={handleCompose}
          isDark={isDark}
        />

        {/* Compose Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          isDark={isDark}
        >
          <TweetComposer 
            currentUser={currentUser} 
            onTweet={handleTweet} 
            isMobile={isMobile}
            isDark={isDark}
          />
        </Modal>
      </div>
    </BrowserRouter>
  );
};

export default App;