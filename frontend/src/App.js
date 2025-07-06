import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Sidebar,
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

  const renderMainContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="min-h-screen">
            <Header title="Home" />
            <TweetComposer currentUser={currentUser} onTweet={handleTweet} />
            <div className="divide-y divide-gray-800">
              {tweets.map(tweet => (
                <Tweet
                  key={tweet.id}
                  tweet={tweet}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onRetweet={handleRetweet}
                  onReply={handleReply}
                />
              ))}
            </div>
          </div>
        );
      case 'explore':
        return (
          <div className="min-h-screen">
            <SearchBar onSearch={handleSearch} />
            <Header title="Explore" />
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-4">Trending now</h2>
              <div className="space-y-4">
                {trendingTopics.map((trend, index) => (
                  <div key={index} className="p-4 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer">
                    <p className="text-gray-500 text-sm">{trend.category}</p>
                    <h3 className="font-bold text-lg">{trend.title}</h3>
                    <p className="text-gray-500 text-sm">{trend.posts} posts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="min-h-screen">
            <Header title="Notifications" />
            <div className="p-4">
              <p className="text-gray-500">No new notifications</p>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="min-h-screen">
            <Header title="Messages" />
            <div className="p-4">
              <p className="text-gray-500">No messages yet</p>
            </div>
          </div>
        );
      case 'bookmarks':
        return (
          <div className="min-h-screen">
            <Header title="Bookmarks" />
            <div className="p-4">
              <p className="text-gray-500">No bookmarks yet</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="min-h-screen">
            <Header title="Profile" />
            <div className="p-4">
              <div className="flex items-center space-x-4 mb-6">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                  <p className="text-gray-500">@{currentUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="font-bold text-lg">123</p>
                  <p className="text-gray-500">Following</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">456</p>
                  <p className="text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">789</p>
                  <p className="text-gray-500">Posts</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="min-h-screen">
            <Header title="Home" />
            <div className="p-4">
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <BrowserRouter>
      <div className="bg-black text-white min-h-screen">
        <div className="max-w-6xl mx-auto flex">
          <Sidebar 
            currentUser={currentUser} 
            onNavigate={handleNavigation}
          />
          
          <main className="flex-1 ml-64 mr-80 border-x border-gray-800">
            <Routes>
              <Route path="/" element={renderMainContent()} />
              <Route path="/explore" element={renderMainContent()} />
              <Route path="/notifications" element={renderMainContent()} />
              <Route path="/messages" element={renderMainContent()} />
              <Route path="/bookmarks" element={renderMainContent()} />
              <Route path="/profile" element={renderMainContent()} />
            </Routes>
          </main>
          
          <aside className="fixed right-0 top-0 h-screen overflow-y-auto">
            <RightSidebar 
              trends={trendingTopics}
              suggestions={followSuggestions}
            />
          </aside>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <TweetComposer currentUser={currentUser} onTweet={handleTweet} />
        </Modal>
      </div>
    </BrowserRouter>
  );
};

export default App;