import React from "react";
import Svg from "../svg";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "../../utils/genericUtils";
import {useUserRoles} from "../../utils/hooks/useUserRole";

type Props = {
    smallScreen?: boolean;
    expanded?: boolean;
};

export default function NavOptions({
                                       smallScreen = false,
                                       expanded = true,
                                   }: Props) {
    const roles = useUserRoles(); // undefined mientras carga, o string[] una vez fetch
    const isAdmin = Array.isArray(roles) && roles.includes("admin");

    return (
        <>
            {/* <NavItem
                link="/"
                svgIcon={<Svg.ChartPieSvg />}
                title="Calendario"
                expanded={expanded}
            />

            <NavItem
                link="/asistencia"
                svgIcon={<Svg.MessagesSvg />}
                title="Asistencias"
                expanded={expanded}
            /> */}

            <NavItem
                link="/pacientes"
                svgIcon={<Svg.UsersSvg />}
                title="Pacientes"
                expanded={expanded}
            />

            <NavItem
                link="/inventario"
                svgIcon={<Svg.ChartPieSvg />}
                title="Inventario"
                expanded={expanded}
            />

            {/* Sólo se muestra si el usuario tiene rol "admin" */}
            {isAdmin && (
                <NavItem
                    link="/estudiantes"
                    svgIcon={<Svg.UsersSvg />}
                    title="Estudiantes"
                    expanded={expanded}
                />
            )}

            {smallScreen && (
                <>
                    <NavItem
                        link="/settings"
                        svgIcon={<Svg.CogSvg />}
                        title="Settings"
                        expanded={expanded}
                    />
                    <a
                        onClick={signOut}
                        className="flex items-center no-underline text-blue-50 hover:text-blue-100 p-3 rounded-md"
                    >
                        <Svg.SignOutSvg />
                        {expanded && <div className="font-bold pl-3">Sign Out</div>}
                    </a>
                </>
            )}
        </>
    );
}

type NavItemProps = {
    link: string;
    svgIcon: JSX.Element;
    title: string;
    expanded?: boolean;
};

const NavItem = ({ link, svgIcon, title, expanded = true }: NavItemProps) => {
    const router = useRouter();
    const isActive = router.pathname.toLowerCase() === link.toLowerCase();

    return (
        <Link href={link} passHref>
            <a
                className={`flex items-center no-underline text-blue-50 hover:text-blue-100 p-3 rounded-md ${
                    isActive ? "bg-[#007C91]" : ""
                }`}
            >
                {svgIcon}
                {expanded && <div className="font-bold pl-3">{title}</div>}
            </a>
        </Link>
    );
};


