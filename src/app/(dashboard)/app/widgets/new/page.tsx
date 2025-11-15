import WidgetForm from '@/components/WidgetForm'

export default function NewWidgetPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Widget</h1>
        <p className="text-gray-600">Set up your AI chat widget to capture leads on your website</p>
      </div>

      <div className="max-w-2xl">
        <WidgetForm />
      </div>
    </div>
  )
}