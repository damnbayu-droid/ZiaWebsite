'use client'

import { useState } from 'react'
import { LoginModal } from './LoginModal'

interface ActionBlockerProps {
    children: React.ReactNode
    isGuest: boolean
    className?: string
}

export function ActionBlocker({ children, isGuest, className = "" }: ActionBlockerProps) {
    const [showModal, setShowModal] = useState(false)

    if (!isGuest) return <>{children}</>

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setShowModal(true)
    }

    return (
        <div onClickCapture={handleClick} className={className}>
            {children}
            <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    )
}
