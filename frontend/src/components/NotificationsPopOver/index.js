import React, { useState, useRef, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import useSound from "use-sound";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { socketConnection } from "../../services/socket";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  tabContainer: {
    overflowY: "auto",
    maxHeight: 350,
    ...theme.scrollbarStyles,
  },
  popoverPaper: {
    width: "100%",
    maxWidth: 350,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 270,
    },
  },
  noShadow: {
    boxShadow: "none !important",
  },
  notificationContainer: {
    backgroundColor: "inherit",
  },
}));

const NotificationsPopOver = () => {
  const classes = useStyles();

  const history = useHistory();
  const { user } = useContext(AuthContext);
  const ticketIdUrl = +history.location.pathname.split("/")[2];
  const ticketIdRef = useRef(ticketIdUrl);
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { profile, queues } = user;

  const [, setDesktopNotifications] = useState([]);

  const { tickets } = useTickets({ withUnreadMessages: "true" });
  const [play] = useSound(alertSound);
  const soundAlertRef = useRef();

  const historyRef = useRef(history);

  useEffect(() => {
    soundAlertRef.current = play;

    if (!("Notification" in window)) {
      console.log("This browser doesn't support notifications");
    } else {
      Notification.requestPermission();
    }
  }, [play]);

  useEffect(() => {
    var filteredTickets = tickets.filter((ticket) => ticket.status !== "closed");
    if(profile === "user"){
      const queueIds = queues.map((q) => q.id);
      filteredTickets = filteredTickets.filter((ticket) => ticket.userId === user?.id || queueIds.indexOf(ticket.queueId) > -1 );
    }
    setNotifications(filteredTickets);
  }, [tickets]);

  useEffect(() => {
    ticketIdRef.current = ticketIdUrl;
  }, [ticketIdUrl]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const queueIds = queues.map((q) => q.id);

    socket.on("connect", () => socket.emit("joinNotification"));

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread" || data.action === "delete") {
        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex((t) => t.id === data.ticketId);
          if (ticketIndex !== -1) {
            prevState.splice(ticketIndex, 1);
            return [...prevState];
          }
          return prevState;
        });

        setDesktopNotifications((prevState) => {
          const notificationIndex = prevState.findIndex(
            (n) => n.tag === String(data.ticketId)
          );
          if (notificationIndex !== -1) {
            prevState[notificationIndex].close();
            prevState.splice(notificationIndex, 1);
            return [...prevState];
          }
          return prevState;
        });
      }
    });

    socket.on(`company-${companyId}-appMessage`, async (data) => {
      if (
        data.action === "create" &&
        !data.message.read &&
        shouldDisplayNotification(data.ticket, user)
      ) {
        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex((t) => t.id === data.ticket.id);
          if (ticketIndex !== -1) {
            prevState[ticketIndex] = data.ticket;
            return [...prevState];
          }
          return [data.ticket, ...prevState];
        });

        const shouldNotNotify =
          (data.message.ticketId === ticketIdRef.current &&
            document.visibilityState === "visible") ||
          (data.ticket.assigneeId && data.ticket.assigneeId !== user.id) ||
          data.ticket.isGroup;

        if (shouldNotNotify) return;

        handleNotifications(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, profile, queues]);

  const shouldDisplayNotification = (ticket, user) => {
    return (
      user.queues.some((queue) => queue.id === ticket.queueId) &&
      (!ticket.assigneeId || ticket.assigneeId !== user.id)
    );
  };

  const handleNotifications = (data) => {
    const { message, contact, ticket } = data;

    const messageBody = message.body?.includes('data:image/png;base64') ? 'Localização'
      : message.body?.includes('BEGIN:VCARD') ? 'Contato'
        : message.body?.includes('jpegThumbnail') ? 'Link'
          : message?.body;

    const options = {
      body: `${messageBody} - ${format(new Date(), "HH:mm")}`,
      icon: contact.profilePicUrl,
      tag: ticket.id,
      renotify: true,
    };

    const notification = new Notification(
      `${i18n.t("tickets.notification.message")} ${contact.name}`,
      options
    );

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      historyRef.current.push(`/tickets/${ticket.uuid}`);
    };

    setDesktopNotifications((prevState) => {
      const notificationIndex = prevState.findIndex(
        (n) => n.tag === notification.tag
      );
      if (notificationIndex !== -1) {
        prevState[notificationIndex] = notification;
        return [...prevState];
      }
      return [notification, ...prevState];
    });

    soundAlertRef.current();
  };

  const handleClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const NotificationTicket = ({ children }) => {
    return (
      <div onClick={handleClickAway} className={classes.notificationContainer}>
        {children}
      </div>
    );
  };

  const sendNotification = async (notification) => {
    const token = localStorage.getItem("tokenNotification");
    if (!token) return;
    const message = {
      to: token,
      title: 'CarPost',
      body: 'Você recebeu uma nova mensagem!',
      data: notification
    };
    try {
      await api.post(`/users/notification`, message);
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Mostrar Notificações"
        variant="contained"
      >
        <ChatIcon />
        <Badge badgeContent={notifications.length} color="secondary">
        </Badge>
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <List dense className={classes.tabContainer}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
            </ListItem>
          ) : (
            notifications.map((ticket) => (
              <NotificationTicket key={ticket.id}>
                <TicketListItem ticket={ticket} />
              </NotificationTicket>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsPopOver;
