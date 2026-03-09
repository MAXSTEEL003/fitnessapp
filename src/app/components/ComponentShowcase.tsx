import { motion } from "motion/react";
import { 
  Card, 
  StatCard, 
  QuoteCard, 
  SectionHeader, 
  InfoRow,
  Button,
  IconButton,
  ActionButton,
  ProgressRing,
  ProgressBar,
  StatBadge,
  MiniStat,
  InputField,
  GlassInputField,
  SwitchField,
  Badge,
  EmptyState,
  PageContainer
} from "./ui";
import { useState } from "react";
import { 
  Heart, 
  Star, 
  Trophy, 
  Flame, 
  Settings, 
  Edit,
  Trash2,
  Clock
} from "lucide-react";

/**
 * ComponentShowcase - Demonstrates all reusable UI components
 * 
 * This file serves as both documentation and a testing ground for all
 * component variations and their props.
 */
export function ComponentShowcase() {
  const [progress, setProgress] = useState(75);
  const [switchValue, setSwitchValue] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <PageContainer>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Component Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-12">
          Reusable components for the 30 Day Shred app
        </p>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Cards
          </h2>
          
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Basic Card
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                A simple card with default styling
              </p>
            </Card>

            <Card gradient>
              <h3 className="font-bold text-white mb-2">Gradient Card</h3>
              <p className="text-white/80">
                A card with gradient background
              </p>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Heart} label="Health" value="98%" delay={0} />
              <StatCard icon={Star} label="Rating" value="4.9" delay={0.1} />
            </div>

            <QuoteCard 
              quote="This is a motivational quote card with an icon"
              icon={Trophy}
            />

            <Card>
              <SectionHeader title="Profile Info" subtitle="Your details" icon={Settings} />
              <div className="space-y-2">
                <InfoRow label="Name" value="John Doe" />
                <InfoRow label="Email" value="john@example.com" />
                <InfoRow label="Status" value="Active" border={false} />
              </div>
            </Card>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Buttons
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">Small Primary</Button>
              <Button variant="primary" size="md">Medium Primary</Button>
              <Button variant="primary" size="lg">Large Primary</Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button icon={Heart} iconPosition="left">With Icon</Button>
              <Button icon={Star} iconPosition="right">Icon Right</Button>
            </div>

            <Button fullWidth>Full Width Button</Button>

            <div className="flex gap-4 justify-center bg-white dark:bg-gray-900 p-6 rounded-xl">
              <IconButton icon={Heart} label="Like" />
              <IconButton icon={Star} label="Favorite" variant="active" />
              <IconButton icon={Settings} label="Settings" />
            </div>

            <div className="space-y-2">
              <ActionButton
                icon={Edit}
                label="Edit Profile"
                description="Update your information"
                onClick={() => alert('Edit clicked')}
              />
              <ActionButton
                icon={Trash2}
                label="Delete Account"
                description="Permanently remove your data"
                onClick={() => alert('Delete clicked')}
                variant="danger"
              />
            </div>
          </div>
        </section>

        {/* Progress Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Progress Components
          </h2>
          
          <div className="space-y-6">
            <Card>
              <div className="flex justify-center mb-6">
                <ProgressRing progress={progress} size={160} />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Drag to change progress
              </p>
            </Card>

            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Progress Bars
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Blue</p>
                  <ProgressBar progress={75} color="blue" showLabel />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Green</p>
                  <ProgressBar progress={90} color="green" showLabel />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Yellow</p>
                  <ProgressBar progress={50} color="yellow" showLabel />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Red</p>
                  <ProgressBar progress={25} color="red" showLabel />
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              <StatBadge icon={Flame} value={7} color="yellow" />
              <StatBadge icon={Heart} value={98} color="red" />
              <StatBadge icon={Star} value={4.9} color="blue" />
            </div>

            <Card>
              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Days" value={15} color="blue" />
                <MiniStat label="Streak" value={7} color="green" />
                <MiniStat label="Best" value={10} color="purple" />
              </div>
            </Card>
          </div>
        </section>

        {/* Form Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Form Components
          </h2>
          
          <div className="space-y-6">
            <Card>
              <InputField
                label="Email Address"
                type="email"
                value={inputValue}
                onChange={setInputValue}
                icon={Heart}
                placeholder="your@email.com"
              />
            </Card>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl">
              <GlassInputField
                label="Password"
                type="password"
                value=""
                onChange={() => {}}
                icon={Clock}
                placeholder="Enter password"
              />
            </div>

            <Card>
              <SwitchField
                label="Enable notifications"
                description="Receive daily reminders"
                checked={switchValue}
                onChange={setSwitchValue}
              />
            </Card>

            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
            </div>

            <Card>
              <EmptyState
                icon={Heart}
                title="No items found"
                description="There are no items to display at the moment"
                action={<Button>Create New</Button>}
              />
            </Card>
          </div>
        </section>

        {/* Component Props Reference */}
        <section className="mb-12">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Component Props Reference
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Card</h3>
                <code className="text-gray-600 dark:text-gray-400">
                  gradient?: boolean | hoverable?: boolean | delay?: number
                </code>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Button</h3>
                <code className="text-gray-600 dark:text-gray-400">
                  variant?: "primary" | "secondary" | "danger" | "ghost"
                </code>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">ProgressBar</h3>
                <code className="text-gray-600 dark:text-gray-400">
                  color?: "blue" | "green" | "yellow" | "red"
                </code>
              </div>
            </div>
          </Card>
        </section>
      </PageContainer>
    </div>
  );
}
