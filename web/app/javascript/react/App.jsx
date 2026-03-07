import React, { Fragment, useState } from "react";
import { Dialog, Transition, Menu, Switch, Tab, Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const tabs = {
    Overview: (
      <div className="space-y-2">
        <p className="text-gray-600">Welcome to iQB. The app is for football game planning. This is a Rails + React starter wired with Tailwind and Headless UI and auto reload.</p>
        <p className="text-gray-600">Use the menu, toggle, and modal to see interactive components in the app.</p>
      </div>
    ),
    Team: (
      <ul className="list-disc pl-5 text-gray-700">
        <li>Coach</li>
        <li>Quarterback</li>
        <li>Defense</li>
      </ul>
    ),
    Settings: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Enable notifications</span>
          <Switch
            checked={enabled}
            onChange={setEnabled}
            className={classNames(
              enabled ? "bg-blue-600" : "bg-gray-300",
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            )}
          >
            <span
              className={classNames(
                enabled ? "translate-x-6" : "translate-x-1",
                "inline-block h-4 w-4 transform rounded-full bg-white transition"
              )}
            />
          </Switch>
        </div>
        <p className="text-sm text-gray-500">Changes take effect immediately.</p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Bars3Icon className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold">iQB</h1>
          </div>
          <Menu as="div" className="relative">
            <Menu.Button className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              Menu
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-md border bg-white p-1 shadow-lg focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={classNames(
                        "w-full rounded px-3 py-2 text-left text-sm",
                        active ? "bg-gray-100" : ""
                      )}
                      onClick={() => setOpen(true)}
                    >
                      Open Modal
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="https://headlessui.com/react"
                      target="_blank"
                      rel="noreferrer"
                      className={classNames(
                        "block rounded px-3 py-2 text-sm",
                        active ? "bg-gray-100" : ""
                      )}
                    >
                      Headless UI Docs
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Modal
          </button>
        </div>

        <Tab.Group>
          <Tab.List className="flex gap-2 rounded-lg border bg-white p-1">
            {Object.keys(tabs).map((name) => (
              <Tab
                key={name}
                className={({ selected }) =>
                  classNames(
                    "rounded-md px-3 py-2 text-sm outline-none",
                    selected ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                {name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-4">
            {Object.values(tabs).map((content, idx) => (
              <Tab.Panel
                key={idx}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                {content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        <div className="mt-8">
          <Disclosure>
            {({ open: isOpen }) => (
              <>
                <Disclosure.Button className="flex w-full items-center justify-between rounded-md border bg-white px-4 py-3 text-left text-sm font-medium hover:bg-gray-50">
                  <span>What is Headless UI?</span>
                  <ChevronDownIcon
                    className={classNames(
                      "h-5 w-5 transition",
                      isOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="border-x border-b bg-white px-4 py-3 text-sm text-gray-600">
                  Headless UI provides unstyled, fully accessible UI components designed to
                  integrate with Tailwind CSS.
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </main>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={setOpen} className="relative z-50">
          <Transition.Child
            enter="transition-opacity ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold">Hello from Headless UI</Dialog.Title>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded p-1 hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-3 text-gray-600">
                  This dialog demonstrates Headless UI transitions and accessibility, styled with Tailwind.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
