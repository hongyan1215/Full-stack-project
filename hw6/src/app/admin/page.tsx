import { getGameSessions } from '@/app/actions/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const sessions = await getGameSessions();

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Game Sessions
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Monitoring all active and ended adventures.
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <li key={session._id}>
              <Link
                href={`/admin/${session._id}`}
                className="block hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-indigo-600 truncate">
                      {session.lineUserId.substring(0, 10)}...
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Messages: {session.messageCount}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Last Active: {new Date(session.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {sessions.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              No game sessions found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

