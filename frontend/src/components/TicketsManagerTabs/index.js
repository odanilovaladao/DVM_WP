import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory,  } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Button, Typography } from "@material-ui/core";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import StatusTicketsSelect from "../StatusTicketsSelect";

const isMobile = window.innerWidth < 700;

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  tabsHeader: {
    flex: "none",
    backgroundColor: "#eee",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },

  tab: {
    minWidth: 120,
    width: 120,
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    background: "#fafafa",
    height: 45,
    padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    background: "#fff",
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
  },

  badge: {
    right: "-10px",
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const searchOpenInputRef = useRef();
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [tags, setTags] = useState([]);
  const [statusTicket, setStatusTicket] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedTagsIds, setSelectedTagsIds] = useState([]);
  const [selectedStatusIds, setSelectedStatusIds] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }

    loadTags();
    loadStatusTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
  }, [tab]);

  const loadTags = async () => {
    try {
      const { data } = await api.get(`/tags/list`);
      setTags(data);
    } catch (err) {
      toastError(err);
    }
  }

  const loadStatusTicket = async () => {
    try {
      const { data } = await api.get(`/tickets-status/listSimple`);
      setStatusTicket(data);
    } catch (err) {
      toastError(err);
    }
  }

  let searchTimeout;

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      //setTab("open");
      return;
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    setSearchParam("");
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setSelectedUsers(users);
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          console.log("ticket", ticket);
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
          style={{height: isMobile? 40 : 70}}
        >
          <Tab
            value={"open"}
            icon={<MoveToInboxIcon />}
            label={isMobile? undefined : i18n.t("tickets.tabs.open.title")}
            classes={{ root: classes.tab }}
            style={{fontSize: 12}}
          />
          <Tab
            value={"closed"}
            icon={<CheckBoxIcon />}
            label={isMobile? undefined : i18n.t("tickets.tabs.closed.title")}
            classes={{ root: classes.tab }}
            style={{fontSize: 12}}

          />
          <Tab
            value={"search"}
            icon={<SearchIcon />}
            label={isMobile? undefined : i18n.t("tickets.tabs.search.title")}
            classes={{ root: classes.tab }}
            style={{fontSize: 12}}

          />
        </Tabs>
      </Paper>
      <Paper square elevation={0} className={classes.ticketOptionsBox} style={{height: isMobile? 45 : 45, padding: isMobile? 0: 8}}>
        {tab === "search" ? (
          <></>
        ) : (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setNewTicketModalOpen(true)}
              style={{height: 30}}
            >
              {i18n.t("ticketsManager.buttons.newTicket")}
            </Button>
            <Can
              role={user.profile}
              perform="tickets-manager:showall"
              yes={() => (
                <FormControlLabel
                  style={{width: 60, marginRight:5, marginLeft: 5, display: isMobile? 'flex' : 'flex'}}
                  label={<Typography style={{fontSize: 13}}>{i18n.t("tickets.buttons.showAll")}</Typography>}
                  labelPlacement="top"
                  control={
                    <Switch
                      size="small"
                      checked={showAllTickets}
                      onChange={() =>
                        setShowAllTickets((prevState) => !prevState)
                      }
                      name="showAllTickets"
                      color="primary"
                    />
                  }
                />
              )}
            />
          </>
        )}
        
        {(!isMobile || isMobile) && <><TicketsQueueSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedQueueIds}
          userQueues={user?.queues}
          onChange={(values) => setSelectedQueueIds(values)}
        />
        <TicketsQueueSelect
          placeholder="Tags"
          style={{ marginLeft: 6, width: 50 }}
          selectedQueueIds={selectedTagsIds}
          userQueues={tags}
          onChange={(values) => setSelectedTagsIds(values)}
        />
        <StatusTicketsSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedStatusIds}
          userQueues={statusTicket}
          onChange={(values) => setSelectedStatusIds(values)}
        />
        </>}
        
      </Paper>
      {tab === "search" && (
        <div className={classes.serachInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            inputRef={searchInputRef}
            placeholder={i18n.t("tickets.search.placeholder")}
            type="search"
            onChange={handleSearch}
          />
        </div>
      )}
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={openCount}
                color="primary"
              >
                {i18n.t("ticketsList.assignedHeader")}
              </Badge>
            }
            value={"open"}
          />
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={pendingCount}
                color="secondary"
              >
                {i18n.t("ticketsList.pendingHeader")}
              </Badge>
            }
            value={"pending"}
          />
        </Tabs>
        <Paper className={classes.ticketsWrapper}>
          {/*<TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
          />*/}
          <>
            <Paper square elevation={0} className={classes.ticketOptionsBox}>
              <SearchIcon className={classes.searchIcon} />
              <InputBase
                className={classes.searchInput}
                placeholder={i18n.t("tickets.search.placeholder")}
                type="search"
                onChange={handleSearch}
              />
            </Paper>
            <TicketsList
              status="open"
              searchParam={searchParam}
              showAll={showAllTickets}
              selectedQueueIds={selectedQueueIds}
              selectedTagsIds={selectedTagsIds}
              selectedStatusIds={selectedStatusIds}
              updateCount={(val) => setOpenCount(val)}
              style={applyPanelStyle("open")}
            />
          </>
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            selectedTagsIds={selectedTagsIds}
            selectedStatusIds={selectedStatusIds}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
          />
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          selectedTagsIds={selectedTagsIds}
          selectedStatusIds={selectedStatusIds}
        />
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        {/*<TagsFilter onFiltered={handleSelectedTags} />*/}
        {profile === "admin" && (
          <UsersFilter onFiltered={handleSelectedUsers} />
        )}
        <TicketsList
          searchParam={searchParam}
          showAll={true}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
          selectedTagsIds={selectedTagsIds}
          selectedStatusIds={selectedStatusIds}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
