import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { friendApi } from '../services/api';
import type { FriendBalance } from '../types';

function FriendProfilePage() {
  const { friendCode } = useParams<{ friendCode: string }>();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<FriendBalance | null>(null);
  const [friendName, setFriendName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (friendCode) {
      loadFriendData();
    }
  }, [friendCode]);

  const loadFriendData = async () => {
    if (!friendCode) return;

    try {
      setLoading(true);
      const [friendResponse, balanceResponse] = await Promise.all([
        friendApi.getByCode(friendCode),
        friendApi.getBalance(friendCode),
      ]);

      setFriendName(friendResponse.data.name);
      setEditedName(friendResponse.data.name);
      setBalance(balanceResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to load friend data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!friendCode || !editedName.trim()) return;

    try {
      await friendApi.update(friendCode, editedName);
      setFriendName(editedName);
      setIsEditingName(false);
      setError('');
    } catch (err) {
      setError('Failed to update name');
      console.error(err);
    }
  };

  const handleCopyCode = async () => {
    if (!friendCode) return;

    try {
      await navigator.clipboard.writeText(friendCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Friend not found</p>
      </div>
    );
  }

  const netBalanceColor = balance.netBalance > 0 ? 'text-green-600' : balance.netBalance < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Home
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleUpdateName}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditedName(friendName);
                    setIsEditingName(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{friendName}</h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit Name
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Friend Code (Share this to join sessions)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={friendCode}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
              />
              <button
                onClick={handleCopyCode}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="text-center py-6 border-t border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Net Balance</p>
            <p className={`text-5xl font-bold ${netBalanceColor}`}>
              ${Math.abs(balance.netBalance).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {balance.netBalance > 0 ? 'You are owed' : balance.netBalance < 0 ? 'You owe' : 'All settled up'}
            </p>
          </div>
        </div>

        {balance.byFriend.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Balance by Friend</h2>
            <div className="space-y-2">
              {balance.byFriend.map((debt) => (
                <div
                  key={debt.friendId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{debt.friendName}</span>
                  <span className={debt.amount > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {debt.amount > 0 ? '+' : ''}${debt.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {balance.bySession.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Balance by Session</h2>
            <div className="space-y-2">
              {balance.bySession.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => navigate(`/session/${session.sessionId}`)}
                >
                  <span className="font-medium text-gray-900">{session.sessionName}</span>
                  <span className={session.balance > 0 ? 'text-green-600 font-semibold' : session.balance < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                    {session.balance > 0 ? '+' : ''}${session.balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {balance.bySession.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-center">No sessions yet. Join a session using your friend code!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendProfilePage;
