import React from "react";

import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { Checkbox, ListItemText } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const TicketsQueueSelect = ({
	userQueues,
	selectedQueueIds = [],
	onChange,
	placeholder
}) => {
	const handleChange = e => {
		onChange(e.target.value);
	};

	return (
		<div style={{ width: 70, marginTop: -4 }}>
			<FormControl fullWidth margin="dense">
				<Select
					multiple
					displayEmpty
					variant="standard"
					value={selectedQueueIds}
					onChange={handleChange}
					MenuProps={{
						anchorOrigin: {
							vertical: "bottom",
							horizontal: "left",
						},
						transformOrigin: {
							vertical: "top",
							horizontal: "left",
						},
						getContentAnchorEl: null,
					}}
					renderValue={() => placeholder? placeholder : i18n.t("ticketsQueueSelect.placeholder")}
					style={{ height: 30, fontSize: 12 }}
				>
					{userQueues?.length > 0 &&
						userQueues.map(queue => (
							<MenuItem dense key={queue.id} value={queue.id}>
								<Checkbox
									style={{
										color: queue.color,
									}}
									size="small"
									color="primary"
									checked={selectedQueueIds.indexOf(queue.id) > -1}
								/>
								<ListItemText primary={queue.name} />
							</MenuItem>
						))}
				</Select>
			</FormControl>
		</div>
	);
};

export default TicketsQueueSelect;
