import React from 'react';
import { User, Mail, Shield } from 'lucide-react';

const Profile: React.FC = () => {
    // Placeholder data - in a real app, this would come from the auth context or API
    const user = {
        name: "Utilisateur",
        email: "user@example.com",
        role: "Admin"
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Profil</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6">
                        <div className="w-32 h-32 rounded-full bg-white p-1 inline-block">
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <User size={64} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Nom</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <User className="w-5 h-5 mr-3 text-gray-400" />
                                {user.name}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                                {user.email}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Rôle</label>
                            <div className="flex items-center text-gray-900 text-lg font-medium">
                                <Shield className="w-5 h-5 mr-3 text-gray-400" />
                                {user.role}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
