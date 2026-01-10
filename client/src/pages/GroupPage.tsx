import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupApi, sessionApi, participantApi } from '../services/api';
import type { GroupDetail, Session } from '../types';

function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFriendCode, setNewFriendCode] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [addAllMembers, setAddAllMembers] = useState(true);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await groupApi.getById(id);
      setGroup(response.data);
      setEditedGroupName(response.data.name);
      setError('');
    } catch (err) {
      setError('Failed to load group');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!id || !editedGroupName.trim()) return;

    try {
      await groupApi.update(id, editedGroupName.trim());
      setEditingName(false);
      loadGroup();
    } catch (err) {
      setError('Failed to update group name');
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newFriendCode.trim()) return;

    try {
      await groupApi.addMember(id, newFriendCode.trim());
      setNewFriendCode('');
      loadGroup();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add member');
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !confirm('Are you sure you want to remove this member from the group?')) return;

    try {
      await groupApi.removeMember(id, memberId);
      loadGroup();
    } catch (err) {
      setError('Failed to remove member');
      console.error(err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSessionName.trim()) return;

    try {
      const response = await sessionApi.create(newSessionName.trim(), id);
      const sessionId = response.data.id;

      // If addAllMembers is checked, add all group members as participants
      if (addAllMembers && group) {
        await Promise.all(
          group.members.map((member) =>
            participantApi.create(sessionId, { friendCode: member.friend.friendCode })
          )
        );
      }

      setShowSessionModal(false);
      setNewSessionName('');
      setAddAllMembers(true);
      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError('Failed to create session');
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button
            onClick={() => navigate('/groups')}
            className="text-blue-600 hover:underline"
          >
            Go back to groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to groups
          </button>
          <div className="flex items-center gap-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedGroupName}
                  onChange={(e) => setEditedGroupName(e.target.value)}
                  className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleUpdateGroupName}
                  className="text-green-600 hover:text-green-800"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setEditedGroupName(group.name);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Group Members</h2>
            <form onSubmit={handleAddMember} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFriendCode}
                  onChange={(e) => setNewFriendCode(e.target.value)}
                  placeholder="Enter friend code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            </form>

            {group.members.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No members yet. Add friends using their friend code.
              </p>
            ) : (
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <button
                        onClick={() => navigate(`/friend/${member.friend.friendCode}`)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {member.friend.name}
                      </button>
                      <p className="text-sm text-gray-500">{member.friend.friendCode}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Group Sessions</h2>
              <button
                onClick={() => setShowSessionModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Session
              </button>
            </div>

            {group.sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No sessions yet. Create one to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <h3 className="font-medium text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-500">
                      {session._count?.participants || 0} participants •{' '}
                      {session._count?.items || 0} items
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Session</h3>
            <form onSubmit={handleCreateSession}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g., Friday Night Out"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addAllMembers}
                    onChange={(e) => setAddAllMembers(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Add all group members as participants
                  </span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    setNewSessionName('');
                    setAddAllMembers(true);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupPage;
