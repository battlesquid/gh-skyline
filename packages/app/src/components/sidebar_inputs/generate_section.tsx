import { Tabs } from "@mantine/core";
import { IconBrandGithubFilled, IconCode } from "@tabler/icons-react";
import { CustomDataInput } from "./custom_data_input";
import { GithubDataInput } from "./github_data_input";
import { SkylineDatasource, useParametersContext } from "../../stores/parameters";
import { isAuthenticated } from "../../api/auth";
import { LoginInput } from "./login_input";

export interface GenerateSectionProps {
    ok: boolean;
    login: string;
}


export function GenerateSection({ ok, login }: GenerateSectionProps) {
    const datasource = useParametersContext((state) => state.inputs.datasource);
    const setInputs = useParametersContext((state) => state.setInputs);
    return (
        <Tabs
            value={datasource}
            onChange={(datasource) => {
                setInputs({ datasource: datasource as SkylineDatasource })
            }}
        >
            <Tabs.List grow mb={8}>
                <Tabs.Tab value={SkylineDatasource.Github} leftSection={<IconBrandGithubFilled size={12} />}>
                    Github
                </Tabs.Tab>
                <Tabs.Tab value={SkylineDatasource.Custom} leftSection={<IconCode size={12} />}>
                    Custom
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="github">
                {isAuthenticated() && <GithubDataInput ok={ok} login={login} />}
                {!isAuthenticated() && <LoginInput />}
            </Tabs.Panel>

            <Tabs.Panel value="custom">
                <CustomDataInput />
            </Tabs.Panel>
        </Tabs>
    );
}
