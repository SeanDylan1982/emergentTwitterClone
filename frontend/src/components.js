import React, { useState } from 'react';

// Icon Components
export const HomeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const SearchIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const BellIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export const MailIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const BookmarkIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

export const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const DotsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

export const HeartIcon = ({ className = "w-6 h-6", filled = false }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const RetweetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const ReplyIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

export const ShareIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

export const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

export const ImageIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const EmojiIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const CalendarIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const VerifiedIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.056-2.13c-.293-.305-.288-.778.006-1.08.295-.301.77-.307 1.074-.012l1.364 1.42 3.494-5.23c.23-.345.696-.436 1.04-.207.346.23.44.696.204 1.04z"/>
  </svg>
);

// Sidebar Component
export const Sidebar = ({ currentUser, onNavigate }) => {
  const navItems = [
    { icon: HomeIcon, label: 'Home', key: 'home' },
    { icon: SearchIcon, label: 'Explore', key: 'explore' },
    { icon: BellIcon, label: 'Notifications', key: 'notifications' },
    { icon: MailIcon, label: 'Messages', key: 'messages' },
    { icon: BookmarkIcon, label: 'Bookmarks', key: 'bookmarks' },
    { icon: UserIcon, label: 'Profile', key: 'profile' },
    { icon: DotsIcon, label: 'More', key: 'more' },
  ];

  return (
    <div className="w-64 h-screen bg-black text-white p-4 fixed left-0 top-0 border-r border-gray-800">
      <div className="flex items-center space-x-2 mb-8">
        <XIcon className="w-8 h-8" />
      </div>
      
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="flex items-center space-x-4 w-full p-3 rounded-full hover:bg-gray-900 transition-colors"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xl font-light">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full mt-8 transition-colors">
        Post
      </button>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center space-x-3 p-3 rounded-full hover:bg-gray-900 cursor-pointer transition-colors">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{currentUser.name}</p>
            <p className="text-gray-500 truncate">@{currentUser.username}</p>
          </div>
          <DotsIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// Tweet Composer Component
export const TweetComposer = ({ currentUser, onTweet }) => {
  const [tweetText, setTweetText] = useState('');
  const maxLength = 280;

  const handleTweet = () => {
    if (tweetText.trim()) {
      onTweet(tweetText.trim());
      setTweetText('');
    }
  };

  return (
    <div className="border-b border-gray-800 p-4">
      <div className="flex space-x-4">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-xl placeholder-gray-500 resize-none border-none outline-none"
            rows="3"
            maxLength={maxLength}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-4">
              <button className="text-blue-500 hover:text-blue-400 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="text-blue-500 hover:text-blue-400 transition-colors">
                <EmojiIcon className="w-5 h-5" />
              </button>
              <button className="text-blue-500 hover:text-blue-400 transition-colors">
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${tweetText.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                {maxLength - tweetText.length}
              </span>
              <button
                onClick={handleTweet}
                disabled={!tweetText.trim() || tweetText.length > maxLength}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-full transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tweet Component
export const Tweet = ({ tweet, currentUser, onLike, onRetweet, onReply }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [likesCount, setLikesCount] = useState(tweet.likes);
  const [retweetsCount, setRetweetsCount] = useState(tweet.retweets);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike(tweet.id, !isLiked);
  };

  const handleRetweet = () => {
    setIsRetweeted(!isRetweeted);
    setRetweetsCount(isRetweeted ? retweetsCount - 1 : retweetsCount + 1);
    onRetweet(tweet.id, !isRetweeted);
  };

  return (
    <div className="border-b border-gray-800 p-4 hover:bg-gray-950 transition-colors cursor-pointer">
      <div className="flex space-x-3">
        <img 
          src={tweet.user.avatar} 
          alt={tweet.user.name} 
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-bold">{tweet.user.name}</span>
            {tweet.user.verified && <VerifiedIcon className="w-5 h-5 text-blue-500" />}
            <span className="text-gray-500">@{tweet.user.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{tweet.time}</span>
          </div>
          
          <p className="text-white mb-3 leading-relaxed">{tweet.content}</p>
          
          {tweet.image && (
            <div className="mb-3 rounded-2xl overflow-hidden">
              <img 
                src={tweet.image} 
                alt="Tweet image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between max-w-md mt-4">
            <button 
              onClick={() => onReply(tweet.id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-900/20 transition-colors">
                <ReplyIcon className="w-5 h-5" />
              </div>
              <span className="text-sm">{tweet.replies}</span>
            </button>
            
            <button 
              onClick={handleRetweet}
              className={`flex items-center space-x-2 transition-colors group ${isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
            >
              <div className="p-2 rounded-full group-hover:bg-green-900/20 transition-colors">
                <RetweetIcon className="w-5 h-5" />
              </div>
              <span className="text-sm">{retweetsCount}</span>
            </button>
            
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors group ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-900/20 transition-colors">
                <HeartIcon className="w-5 h-5" filled={isLiked} />
              </div>
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-900/20 transition-colors">
                <ShareIcon className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Right Sidebar Component
export const RightSidebar = ({ trends, suggestions }) => {
  return (
    <div className="w-80 p-4 space-y-4">
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">What's happening</h2>
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <div key={index} className="hover:bg-gray-800 p-3 rounded-lg transition-colors cursor-pointer">
              <p className="text-gray-500 text-sm">{trend.category}</p>
              <p className="font-semibold">{trend.title}</p>
              <p className="text-gray-500 text-sm">{trend.posts} posts</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Who to follow</h2>
        <div className="space-y-3">
          {suggestions.map((user, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                </div>
              </div>
              <button className="bg-white text-black px-4 py-1 rounded-full font-semibold hover:bg-gray-200 transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Search Component
export const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 p-4">
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search"
          className="w-full bg-gray-900 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-black transition-colors"
        />
      </form>
    </div>
  );
};

// Header Component
export const Header = ({ title, showBackButton = false, onBack }) => {
  return (
    <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-gray-800">
      <div className="flex items-center p-4">
        {showBackButton && (
          <button 
            onClick={onBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-black border border-gray-800 rounded-2xl max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Compose post</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};