import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, X } from 'lucide-react';
export default function LoginModal({ onLogin }) {
    const [isVisible, setIsVisible] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Get credentials from environment variables
    const VALID_USERNAME = process.env.REACT_APP_USERNAME || 'admin';
    const VALID_PASSWORD = process.env.REACT_APP_PASSWORD || 'password123';
    console.log(VALID_USERNAME);
    
    // Cookie utilities
    const setCookie = (name, value, hours) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    };
    const getCookie = (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };
    const deleteCookie = (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    };
    // Check authentication status on component mount
    useEffect(() => {
        const authToken = getCookie('auth_token');
        const loginTime = getCookie('login_time');
        
        if (authToken && loginTime) {
            const currentTime = new Date().getTime();
            const storedTime = parseInt(loginTime);
            const hoursDiff = (currentTime - storedTime) / (1000 * 60 * 60);
            
            // Check if token is still valid (less than 24 hours)
            if (hoursDiff < 24) {
                setIsVisible(false);
                if (onLogin) onLogin(true);
                return;
            } else {
                // Token expired, clear cookies
                deleteCookie('auth_token');
                deleteCookie('login_time');
            }
        }
        
        // Show modal if not authenticated
        setIsVisible(true);
        if (onLogin) onLogin(false);
    }, [onLogin]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Validate credentials
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // Set cookies with 24-hour expiration
            const currentTime = new Date().getTime().toString();
            setCookie('auth_token', 'authenticated', 24);
            setCookie('login_time', currentTime, 24);
            
            setIsVisible(false);
            setIsLoading(false);
            if (onLogin) onLogin(true);
        } else {
            setError('نام کاربری یا رمز عبور نامعتبر است');
            setIsLoading(false);
        }
    };
    const handleLogout = () => {
        deleteCookie('auth_token');
        deleteCookie('login_time');
        setIsVisible(true);
        setUsername('');
        setPassword('');
        setError('');
        if (onLogin) onLogin(false);
    };
    // Make logout function available globally for testing
    useEffect(() => {
        window.logout = handleLogout;
        return () => {
            delete window.logout;
        };
    }, []);
    if (!isVisible) {
        return null;
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">خوش آمدید</h2>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Lock className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 mb-6">لطفاً برای ادامه وارد شوید</p>
                </div>
                {/* Form */}
                <div className="px-6 pb-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">نام کاربری</label>
                            <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="نام کاربری خود را وارد کنید"
                                    required
                                />
                            </div>
                        </div>
                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pr-10 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="رمز عبور خود را وارد کنید"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    در حال ورود...
                                </>
                            ) : (
                                'ورود'
                            )}
                        </button>
                    </form>
                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            نشست پس از 24 ساعت منقضی خواهد شد
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}