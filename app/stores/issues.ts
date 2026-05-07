import { defineStore } from 'pinia'
import type { Ref } from 'vue'

export interface IssuePhoto {
  id: string
  url: string
  caption?: string
  uploadedAt: Date
}

export interface IssueComment {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: Date
}

export interface Issue {
  id: string
  obraId: string
  title: string
  description: string
  type: 'annotation' | 'comment' | 'accident'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  photos: IssuePhoto[]
  comments: IssueComment[]
}

export interface MiniIssue {
  id: string
  title: string
  type: 'annotation' | 'comment' | 'accident'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdBy: string
  createdAt: Date
  photoCount: number
  commentCount: number
}

export const useIssuesStore = defineStore('issues', {
  state: () => ({
    issues: [] as Ref<Issue[]>,
    currentIssue: null as Issue | null
  }),

  actions: {
    async fetchIssues(obraId: string) {
      // Fetch issues related to a specific obra
      try {
        const response = await $fetch(`/api/issues?obraId=${obraId}`)
        this.issues = response.data
        return response
      } catch (error) {
        console.error('Error fetching issues:', error)
        throw error
      }
    },

    async createIssue(issueData: Partial<Issue>) {
      // Create a new issue
      try {
        const response = await $fetch('/api/issues', {
          method: 'POST',
          body: issueData
        })
        this.issues.push(response.data)
        return response.data
      } catch (error) {
        console.error('Error creating issue:', error)
        throw error
      }
    },

    async updateIssue(issueId: string, updateData: Partial<Issue>) {
      // Update an existing issue
      try {
        const response = await $fetch(`/api/issues/${issueId}`, {
          method: 'PATCH',
          body: updateData
        })
        const index = this.issues.findIndex(i => i.id === issueId)
        if (index !== -1) {
          this.issues[index] = { ...this.issues[index], ...response.data }
        }
        return response.data
      } catch (error) {
        console.error('Error updating issue:', error)
        throw error
      }
    },

    async deleteIssue(issueId: string) {
      // Delete an issue
      try {
        await $fetch(`/api/issues/${issueId}`, {
          method: 'DELETE'
        })
        this.issues = this.issues.filter(i => i.id !== issueId)
      } catch (error) {
        console.error('Error deleting issue:', error)
        throw error
      }
    },

    async uploadPhoto(issueId: string, file: File) {
      // Upload a photo to an issue
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('issueId', issueId)

        const response = await $fetch('/api/issues/upload-photo', {
          method: 'POST',
          body: formData
        })

        // Update the issue with the new photo
        const index = this.issues.findIndex(i => i.id === issueId)
        if (index !== -1) {
          this.issues[index].photos.push(response.data)
        }

        return response.data
      } catch (error) {
        console.error('Error uploading photo:', error)
        throw error
      }
    }
  }
})
