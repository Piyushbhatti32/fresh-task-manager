import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
};

export type GroupTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  tasks: GroupTask[];
  createdAt: number;
};

export type GroupInvitation = {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
};

interface GroupState {
  groups: Group[];
  invitations: GroupInvitation[];
  createGroup: (name: string, description: string, userId: string, userName: string, userEmail: string) => Group;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  addMember: (groupId: string, member: GroupMember) => void;
  removeMember: (groupId: string, memberId: string) => void;
  addTask: (groupId: string, task: GroupTask) => void;
  updateTask: (groupId: string, taskId: string, data: Partial<GroupTask>) => void;
  deleteTask: (groupId: string, taskId: string) => void;
  createInvitation: (groupId: string, groupName: string, invitedBy: string, invitedEmail: string) => GroupInvitation;
  updateInvitationStatus: (invitationId: string, status: 'accepted' | 'declined') => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      invitations: [],
      
      createGroup: (name, description, userId, userName, userEmail) => {
        const newGroup: Group = {
          id: Date.now().toString(),
          name,
          description,
          members: [
            {
              id: userId,
              name: userName,
              email: userEmail,
              role: 'admin'
            }
          ],
          tasks: [],
          createdAt: Date.now()
        };
        
        set(state => ({
          groups: [...state.groups, newGroup]
        }));
        
        return newGroup;
      },
      
      updateGroup: (groupId, data) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId ? { ...group, ...data } : group
          )
        }));
      },
      
      deleteGroup: (groupId) => {
        set(state => ({
          groups: state.groups.filter(group => group.id !== groupId)
        }));
      },
      
      addMember: (groupId, member) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId 
              ? { ...group, members: [...group.members, member] } 
              : group
          )
        }));
      },
      
      removeMember: (groupId, memberId) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId 
              ? { ...group, members: group.members.filter(m => m.id !== memberId) } 
              : group
          )
        }));
      },
      
      addTask: (groupId, task) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId 
              ? { ...group, tasks: [...group.tasks, task] } 
              : group
          )
        }));
      },
      
      updateTask: (groupId, taskId, data) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId 
              ? { 
                  ...group, 
                  tasks: group.tasks.map(task => 
                    task.id === taskId ? { ...task, ...data } : task
                  ) 
                } 
              : group
          )
        }));
      },
      
      deleteTask: (groupId, taskId) => {
        set(state => ({
          groups: state.groups.map(group => 
            group.id === groupId 
              ? { ...group, tasks: group.tasks.filter(t => t.id !== taskId) } 
              : group
          )
        }));
      },
      
      createInvitation: (groupId, groupName, invitedBy, invitedEmail) => {
        const newInvitation: GroupInvitation = {
          id: Date.now().toString(),
          groupId,
          groupName,
          invitedBy,
          invitedEmail,
          status: 'pending',
          createdAt: Date.now()
        };
        
        set(state => ({
          invitations: [...state.invitations, newInvitation]
        }));
        
        return newInvitation;
      },
      
      updateInvitationStatus: (invitationId, status) => {
        set(state => ({
          invitations: state.invitations.map(inv => 
            inv.id === invitationId ? { ...inv, status } : inv
          )
        }));
        
        // If accepted, add the user to the group
        if (status === 'accepted') {
          const invitation = get().invitations.find(inv => inv.id === invitationId);
          if (invitation) {
            // This would typically involve more logic to get user details
            // and add them to the group
          }
        }
      },
    }),
    {
      name: 'group-storage',
    }
  )
); 