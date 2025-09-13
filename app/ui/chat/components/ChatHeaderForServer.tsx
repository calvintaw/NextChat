
"use client"

import { Room } from "@/app/lib/definitions";
import { User } from "@/app/lib/definitions";
import { useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { Avatar } from "../../general/Avatar";
import { ServerEditForm } from "./Server_edit_form";

export function ServerCardHeader({ server, user }: { server: Room, user: User }) {
  const [clipboard, setClipboard] = useState("");
  const [localServer, setLocalServer] = useState(() => server)

  const handleCopy = (string: string) => {
    window.navigator.clipboard.writeText(string);
    setClipboard(string);
  };

  return (
    <div className="bg-contrast text-white p-6 pb-2 rounded-lg max-w-md w-full flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Server Icon */}
        <Avatar size="size-14" displayName={localServer.name} src={localServer.profile ?? ""} statusIndicator={false} />
        <div className="flex-1 flex flex-col">
          {/* Server Name */}
          <h2 className="text-xl font-semibold">{localServer.name ?? "No name"}</h2>

          {/* Copy server name */}
          <div
            className="w-fit text-xs text-gray-400 cursor-pointer mt-0.5"
            data-tooltip-id={`server-${localServer.id}`}
          >
            <span onClick={() => handleCopy(localServer.name || "")}>{localServer.name}</span>
            <Tooltip
              className="my-tooltip"
              id={`server-${localServer.id}`}
              place="right"
              border="var(--tooltip-border)"
            >
              <span className="flex items-center gap-1">
                {clipboard === localServer.name ? (
                  <>
                    <FaCheck className="text-green-500" />
                    Copied: {localServer.name}
                  </>
                ) : (
                  <>Copy: {localServer.name}</>
                )}
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Server Description */}
      <p className="text-sm text-gray-400 truncate">{localServer.description || "No description available"}</p>

      {/* Server Stats */}
      <div className="flex items-center gap-4 text-gray-400 text-sm">
        <div className="flex items-center gap-1">
          <div className="size-2 bg-emerald-500 rounded-full" />
          <p>{localServer.online_members?.toLocaleString() ?? 0} Online</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 bg-gray-400 rounded-full" />
          <p>{localServer.total_members?.toLocaleString() ?? 0} Members</p>
        </div>
      </div>

      {localServer.owner_id === user.id && (
        <ServerEditForm setLocalServer={setLocalServer} server={server} user={user} />
      )}
    </div>
  );
}

