import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionApi, friendApi } from '../services/api';
import type { Session } from '../types';

function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [existingFriendCode, setExistingFriendCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getAll();
      setSessions(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    try {
      const response = await sessionApi.create(newSessionName);
      setNewSessionName('');
      navigate(`/session/${response.data.id}`);
    } catch (err) {
      setError('Failed to create session');
      console.error(err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionApi.delete(id);
      loadSessions();
    } catch (err) {
      setError('Failed to delete session');
      console.error(err);
    }
  };

  const handleCreateFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    try {
      const response = await friendApi.create(newFriendName);
      setNewFriendName('');
      navigate(`/friend/${response.data.friendCode}`);
    } catch (err) {
      setError('Failed to create friend profile');
      console.error(err);
    }
  };

  const handleAccessFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingFriendCode.trim()) return;

    try {
      await friendApi.getByCode(existingFriendCode);
      navigate(`/friend/${existingFriendCode}`);
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Friend code not found' : 'Failed to access friend profile');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Amot Calculator
          </h1>
          <p className="text-gray-600">Bill splitting made easy</p>
          <div className="mt-4">
            <button
              onClick={() => navigate('/groups')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Manage Groups
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Friend Profile</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Profile</h3>
                <form onSubmit={handleCreateFriend} className="flex gap-2">
                  <input
                    type="text"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Create
                  </button>
                </form>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Access Existing Profile</h3>
                <form onSubmit={handleAccessFriend} className="flex gap-2">
                  <input
                    type="text"
                    value={existingFriendCode}
                    onChange={(e) => setExistingFriendCode(e.target.value)}
                    placeholder="Enter friend code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Access
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession} className="flex gap-2">
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Enter session name (e.g., Friday Night Out)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No sessions yet. Create one to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{session.name}</h3>
                      {session.group && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {session.group.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {session._count?.participants || 0} participants •{' '}
                      {session._count?.items || 0} items
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className="text-red-600 hover:text-red-800 px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
