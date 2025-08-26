export const initialFiles: Record<string, string> = {
  "src/app.tsx": `import * as React from 'react';
import { Chats } from '@/components/chat';

export default function App() {
    return <Chats />;
}`,
  "src/components/chat.tsx": `
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { PrimaryButton } from '@/components/ui/button';

function ChatBubble({ isAssistant, sender, message, avatar }: { isAssistant: boolean, sender: string, message: string, avatar: string }) {
    return (
        <div className="flex items-start gap-2.5">
            {!isAssistant && <div className="grow"></div>}
            <img className="w-8 h-8 rounded-full object-cover" src={avatar} alt={sender} />
            <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm text-gray-900 dark:text-white">{sender}</span>
                </div>
                <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message}</p>
            </div>
        </div>
    )
}

function ChatView() {
    const [chats, setChats] = React.useState([
        {
            sender: 'Bonnie Green',
            message: 'Hello',
            avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMG6KFqZKKClCagLrBgRn5a6aqC-myicy-Dg&s",
            isAssistant: false,
        },
        {
            sender: 'Assistant',
            message: 'Hey there, how can I help you?',
            avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVTI9p-wqAKmTkLBui0-vsWF2UGVqq8H9NpFAzXvnXQyKnfxApQYfUsqq2LL2nbeue210&usqp=CAU",
            isAssistant: true,
        }
    ])

    return (
        <div className="space-y-4">
            {chats.map((chat, i) => <ChatBubble key={i} isAssistant={chat.isAssistant} sender={chat.sender} message={chat.message} avatar={chat.avatar} />)}
        </div>
    )
}

export function Chats() {
    return (
        <div className="border border-white/10 rounded-xl m-8 p-8">
            <ChatView />
            <div className="flex items-center justify-center gap-2 mt-8">
                <Input />
                <PrimaryButton>Send</PrimaryButton>
            </div>
        </div>
    );
}`,
  "src/components/ui/input.tsx": `import * as React from 'react';

export function Input() {
    return (
        <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Message" required />
    )
}
`,
  "src/components/ui/button.tsx": `import * as React from 'react';

export function PrimaryButton({children}: {children: React.ReactNode}) {
    return (
        <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            {children}
        </button>
    )
}`,
};
